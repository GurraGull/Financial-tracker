/**
 * Auto-Trader Algorithm
 *
 * Two strategies:
 *
 * FADE_EXTREMES — Prediction markets systematically overestimate certainty.
 *   A market at 88% YES is likely closer to 75-80% true probability.
 *   We bet against extreme consensus using a regression-to-mean adjustment.
 *
 * VOLUME_SPIKE — Sudden volume on a near-50% market signals breaking news.
 *   We follow the price direction of that spike (momentum).
 *
 * Position sizing uses fractional Kelly criterion capped at max_position_pct
 * of available bankroll.  Kelly prevents ruin; the cap prevents over-betting
 * on any single market.
 *
 * Each run also checks existing open auto-trades and closes any that hit
 * take-profit, stop-loss, or are within 24h of resolution.
 */

import { getDb } from "@/lib/db";
import {
  fetchMarkets,
  getYesPrice,
  computeEdgeScore,
  daysToResolution,
} from "@/lib/polymarket";
import type { PolymarketMarket } from "@/types";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AutoTraderSettings {
  id: number;
  enabled: number;
  strategy: "fade_extremes" | "volume_spike" | "both";
  min_edge_score: number;
  max_open_positions: number;
  kelly_fraction: number;
  max_position_pct: number;
  fade_threshold_high: number;
  fade_threshold_low: number;
  regression_factor: number;
  take_profit_pct: number;
  stop_loss_pct: number;
  min_days_to_resolution: number;
  max_days_to_resolution: number;
  updated_at: string;
}

export interface Decision {
  market_id: string;
  question: string;
  action: "open" | "close" | "skip";
  reason: string;
  outcome?: "YES" | "NO";
  shares?: number;
  price?: number;
  cost?: number;
  pnl?: number;
  edge_score?: number;
}

export interface RunResult {
  markets_scanned: number;
  trades_opened: number;
  trades_closed: number;
  cash_deployed: number;
  cash_returned: number;
  decisions: Decision[];
}

// ─── Kelly Criterion ─────────────────────────────────────────────────────────

/**
 * Full Kelly fraction for a binary bet.
 * @param p  Our estimated probability the bet wins
 * @param price  The market price we pay (= probability implied by market)
 * @returns Kelly fraction of bankroll to wager (can be negative = no edge)
 */
function kelly(p: number, price: number): number {
  if (price <= 0 || price >= 1) return 0;
  const b = (1 - price) / price; // net odds: profit per $1 wagered
  return (p * (b + 1) - 1) / b;
}

// ─── Strategy: Pick outcome + estimate true probability ───────────────────────

interface Signal {
  outcome: "YES" | "NO";
  betPrice: number;       // price we pay for the chosen outcome
  estimatedProb: number;  // our estimate of true win probability
  reason: string;
}

function fadeExtremesSignal(
  market: PolymarketMarket,
  settings: AutoTraderSettings
): Signal | null {
  const yesPrice = getYesPrice(market);

  if (yesPrice >= settings.fade_threshold_high) {
    // Market is over-confident on YES — bet NO
    const r = settings.regression_factor;
    const trueYes = yesPrice - (yesPrice - 0.5) * r; // pull toward 50%
    return {
      outcome: "NO",
      betPrice: 1 - yesPrice,
      estimatedProb: 1 - trueYes,
      reason: `Fade YES overconfidence (${(yesPrice * 100).toFixed(0)}% → est. ${((1 - trueYes) * 100).toFixed(0)}% NO)`,
    };
  }

  if (yesPrice <= settings.fade_threshold_low) {
    // Market is over-confident on NO — bet YES
    const r = settings.regression_factor;
    const trueYes = yesPrice + (0.5 - yesPrice) * r;
    return {
      outcome: "YES",
      betPrice: yesPrice,
      estimatedProb: trueYes,
      reason: `Fade NO overconfidence (${(yesPrice * 100).toFixed(0)}% → est. ${(trueYes * 100).toFixed(0)}% YES)`,
    };
  }

  return null;
}

function volumeSpikeSignal(
  market: PolymarketMarket,
): Signal | null {
  const yesPrice = getYesPrice(market);
  const volume24h = market.volume_24hr ?? 0;
  const totalVolume = market.volume ?? 0;

  // Only fire on meaningful spikes (>15% of lifetime volume traded today)
  const spikeRatio = totalVolume > 0 ? volume24h / (totalVolume * 0.15 + 1) : 0;
  if (spikeRatio < 1) return null;

  // Momentum: price moving away from 50% on volume = follow direction
  const deviation = yesPrice - 0.5;
  if (Math.abs(deviation) < 0.04) return null; // too close to centre

  const outcome = deviation > 0 ? "YES" : "NO";
  const betPrice = outcome === "YES" ? yesPrice : 1 - yesPrice;

  // Estimate: volume spike confirms directional move, add small edge
  const estimatedProb = Math.min(0.95, betPrice + 0.04);

  return {
    outcome,
    betPrice,
    estimatedProb,
    reason: `Volume spike (${(spikeRatio * 100).toFixed(0)}% of baseline) following ${outcome} momentum`,
  };
}

function pickSignal(
  market: PolymarketMarket,
  settings: AutoTraderSettings
): Signal | null {
  const fade = settings.strategy !== "volume_spike"
    ? fadeExtremesSignal(market, settings)
    : null;

  const spike = settings.strategy !== "fade_extremes"
    ? volumeSpikeSignal(market)
    : null;

  // Prefer whichever signal has higher Kelly value
  if (fade && spike) {
    const kf = kelly(fade.estimatedProb, fade.betPrice);
    const ks = kelly(spike.estimatedProb, spike.betPrice);
    return kf >= ks ? fade : spike;
  }

  return fade ?? spike;
}

// ─── Close Existing Positions ─────────────────────────────────────────────────

type OpenTrade = {
  id: number;
  market_id: string;
  question: string;
  outcome: string;
  shares: number;
  entry_price: number;
  current_price: number | null;
};

async function closeStalePositions(
  settings: AutoTraderSettings,
  db: ReturnType<typeof getDb>
): Promise<Decision[]> {
  const openTrades = db.prepare(`
    SELECT id, market_id, question, outcome, shares, entry_price, current_price
    FROM paper_trades
    WHERE status = 'open' AND trade_type = 'paper' AND notes LIKE 'AUTO:%'
  `).all() as OpenTrade[];

  const decisions: Decision[] = [];

  // Fetch live prices for all open auto-trades in one batch
  const markets = openTrades.length > 0
    ? await fetchMarkets({ limit: 200, active: true }).catch(() => [] as PolymarketMarket[])
    : [];

  const marketMap = new Map<string, PolymarketMarket>(markets.map((m) => [m.id, m]));

  for (const trade of openTrades) {
    const market = marketMap.get(trade.market_id);
    const yesPrice = market ? getYesPrice(market) : null;
    const currentPrice = yesPrice != null
      ? (trade.outcome === "YES" ? yesPrice : 1 - yesPrice)
      : (trade.current_price ?? trade.entry_price);

    const pnlPct = (currentPrice - trade.entry_price) / trade.entry_price;
    const days = market ? daysToResolution(market) : null;

    let closeReason: string | null = null;

    if (pnlPct >= settings.take_profit_pct) {
      closeReason = `Take profit: +${(pnlPct * 100).toFixed(1)}%`;
    } else if (pnlPct <= -settings.stop_loss_pct) {
      closeReason = `Stop loss: ${(pnlPct * 100).toFixed(1)}%`;
    } else if (days !== null && days < 1) {
      closeReason = `Market expires in <1 day`;
    }

    if (!closeReason) continue;

    // Close the trade and return proceeds to bankroll
    const proceeds = trade.shares * currentPrice;
    db.prepare(`
      UPDATE paper_trades
      SET status = 'closed', exit_price = ?, current_price = ?, closed_at = datetime('now')
      WHERE id = ?
    `).run(currentPrice, currentPrice, trade.id);

    db.prepare(`
      UPDATE bankroll
      SET current_balance = current_balance + ?, updated_at = datetime('now')
      WHERE trade_type = 'paper'
    `).run(proceeds);

    const pnl = trade.shares * (currentPrice - trade.entry_price);

    decisions.push({
      market_id: trade.market_id,
      question: trade.question,
      action: "close",
      reason: closeReason,
      outcome: trade.outcome as "YES" | "NO",
      price: currentPrice,
      pnl,
    });
  }

  return decisions;
}

// ─── Learning / Adaptation ────────────────────────────────────────────────────

export interface LearningInsight {
  fade_win_rate: number | null;
  spike_win_rate: number | null;
  recent_stop_losses: number;
  recent_take_profits: number;
  avg_unrealized_pnl_pct: number;
  adjustments: Partial<AutoTraderSettings>;
  notes: string[];
}

type TradeRow = {
  entry_price: number;
  current_price: number | null;
  exit_price: number | null;
  status: string;
  notes: string | null;
};

export function learnAndAdapt(db: ReturnType<typeof getDb>): LearningInsight {
  const settings = db.prepare(
    "SELECT * FROM autotrader_settings WHERE id = 1"
  ).get() as AutoTraderSettings;

  // ── Pull last 30 auto-trades (open + closed) ────────────────────────────
  const recent = db.prepare(`
    SELECT entry_price, current_price, exit_price, status, notes
    FROM paper_trades
    WHERE trade_type = 'paper' AND notes LIKE 'AUTO:%'
    ORDER BY opened_at DESC
    LIMIT 30
  `).all() as TradeRow[];

  // ── Separate by strategy signal ──────────────────────────────────────────
  const fadeRows  = recent.filter((t) => t.notes?.includes("Fade"));
  const spikeRows = recent.filter((t) => t.notes?.includes("spike"));

  function pnlPct(t: TradeRow): number {
    const ref  = t.status === "closed" ? (t.exit_price ?? t.entry_price) : (t.current_price ?? t.entry_price);
    return (ref - t.entry_price) / t.entry_price;
  }

  function winRate(rows: TradeRow[]): number | null {
    if (rows.length < 2) return null;
    const wins = rows.filter((t) => pnlPct(t) > 0).length;
    return wins / rows.length;
  }

  const fade_win_rate  = winRate(fadeRows);
  const spike_win_rate = winRate(spikeRows);

  // Recent stop-losses and take-profits (closed in last 10)
  const lastClosed = recent.filter((t) => t.status === "closed").slice(0, 10);
  const recent_stop_losses   = lastClosed.filter((t) => pnlPct(t) <= -settings.stop_loss_pct * 0.9).length;
  const recent_take_profits  = lastClosed.filter((t) => pnlPct(t) >= settings.take_profit_pct * 0.9).length;

  // Average unrealized P&L on open positions
  const openRows = recent.filter((t) => t.status === "open");
  const avg_unrealized_pnl_pct = openRows.length > 0
    ? openRows.reduce((s, t) => s + pnlPct(t), 0) / openRows.length
    : 0;

  const adjustments: Partial<AutoTraderSettings> = {};
  const notes: string[] = [];

  // ── Rule 1: Too many stop-losses → be more conservative ─────────────────
  if (recent_stop_losses >= 3) {
    adjustments.kelly_fraction   = parseFloat(Math.max(0.10, settings.kelly_fraction - 0.05).toFixed(2));
    adjustments.min_edge_score   = Math.min(85, settings.min_edge_score + 5);
    notes.push(`${recent_stop_losses} recent stop-losses → tightened Kelly to ${adjustments.kelly_fraction}, edge floor to ${adjustments.min_edge_score}`);
  }

  // ── Rule 2: Strong profits flowing → slightly more aggressive ────────────
  if (recent_take_profits >= 3 && recent_stop_losses === 0) {
    adjustments.kelly_fraction = parseFloat(Math.min(0.50, settings.kelly_fraction + 0.05).toFixed(2));
    notes.push(`${recent_take_profits} recent take-profits, 0 stop-losses → raised Kelly to ${adjustments.kelly_fraction}`);
  }

  // ── Rule 3: Fade strategy losing → switch ────────────────────────────────
  if (
    fade_win_rate !== null &&
    fade_win_rate < 0.35 &&
    fadeRows.length >= 4 &&
    settings.strategy === "fade_extremes"
  ) {
    adjustments.strategy = "volume_spike";
    notes.push(`Fade win rate ${(fade_win_rate * 100).toFixed(0)}% over ${fadeRows.length} trades → switching to volume_spike`);
  }

  // ── Rule 4: Spike strategy losing → switch ───────────────────────────────
  if (
    spike_win_rate !== null &&
    spike_win_rate < 0.35 &&
    spikeRows.length >= 4 &&
    settings.strategy === "volume_spike"
  ) {
    adjustments.strategy = "fade_extremes";
    notes.push(`Spike win rate ${(spike_win_rate * 100).toFixed(0)}% over ${spikeRows.length} trades → switching to fade_extremes`);
  }

  // ── Rule 5: Both winning → widen fade thresholds to catch more signals ───
  const overallWin = winRate(lastClosed);
  if (overallWin !== null && overallWin >= 0.65 && lastClosed.length >= 5) {
    adjustments.fade_threshold_high = parseFloat(Math.max(0.70, settings.fade_threshold_high - 0.02).toFixed(2));
    adjustments.fade_threshold_low  = parseFloat(Math.min(0.30, settings.fade_threshold_low  + 0.02).toFixed(2));
    notes.push(`Win rate ${(overallWin * 100).toFixed(0)}% → widened fade thresholds to >${(adjustments.fade_threshold_high! * 100).toFixed(0)}%/<${(adjustments.fade_threshold_low! * 100).toFixed(0)}%`);
  }

  // ── Rule 6: Open positions deeply underwater → tighten stop-loss ─────────
  if (avg_unrealized_pnl_pct < -0.15 && openRows.length >= 3) {
    adjustments.stop_loss_pct = parseFloat(Math.max(0.15, settings.stop_loss_pct - 0.05).toFixed(2));
    notes.push(`Avg open P&L ${(avg_unrealized_pnl_pct * 100).toFixed(1)}% → tightened stop-loss to ${(adjustments.stop_loss_pct * 100).toFixed(0)}%`);
  }

  if (notes.length === 0) {
    notes.push("No adjustments needed — strategy is within normal parameters");
  }

  // Apply adjustments to DB
  if (Object.keys(adjustments).length > 0) {
    const setClauses = Object.keys(adjustments)
      .map((k) => `${k} = @${k}`)
      .join(", ");
    db.prepare(
      `UPDATE autotrader_settings SET ${setClauses}, updated_at = datetime('now') WHERE id = 1`
    ).run(adjustments);
  }

  return {
    fade_win_rate,
    spike_win_rate,
    recent_stop_losses,
    recent_take_profits,
    avg_unrealized_pnl_pct,
    adjustments,
    notes,
  };
}

// ─── Main Run ─────────────────────────────────────────────────────────────────

export async function runAutoTrader(): Promise<RunResult> {
  const db = getDb();

  const settings = db.prepare(
    "SELECT * FROM autotrader_settings WHERE id = 1"
  ).get() as AutoTraderSettings;

  if (!settings.enabled) {
    return {
      markets_scanned: 0,
      trades_opened: 0,
      trades_closed: 0,
      cash_deployed: 0,
      cash_returned: 0,
      decisions: [{ market_id: "", question: "", action: "skip", reason: "Auto-trader is disabled" }],
    };
  }

  const decisions: Decision[] = [];

  // ── 1. Close stale positions first ───────────────────────────────────────
  const closeDecisions = await closeStalePositions(settings, db);
  decisions.push(...closeDecisions);
  const cash_returned = closeDecisions.reduce((s, d) => s + (d.pnl ?? 0) + (d.price ?? 0) * 0, 0);

  // Re-fetch bankroll after closes
  const bankrow = db.prepare("SELECT current_balance FROM bankroll WHERE trade_type='paper'").get() as { current_balance: number };
  let availableCash = bankrow.current_balance;

  // ── 2. Count existing open auto positions ────────────────────────────────
  const openCount = (db.prepare(`
    SELECT COUNT(*) as c FROM paper_trades
    WHERE status='open' AND trade_type='paper' AND notes LIKE 'AUTO:%'
  `).get() as { c: number }).c;

  const slotsAvailable = settings.max_open_positions - openCount;

  if (slotsAvailable <= 0) {
    decisions.push({ market_id: "", question: "", action: "skip", reason: `Max open positions (${settings.max_open_positions}) reached` });
  }

  // ── 3. Scan markets ───────────────────────────────────────────────────────
  const markets = await fetchMarkets({ limit: 200, active: true, closed: false, order: "volume24hr" });

  // Already-open market IDs (avoid doubling up)
  const openMarketIds = new Set<string>(
    (db.prepare("SELECT market_id FROM paper_trades WHERE status='open' AND trade_type='paper'").all() as { market_id: string }[])
      .map((r) => r.market_id)
  );

  // Score and filter candidates
  const candidates = markets
    .map((m) => ({ market: m, edge: computeEdgeScore(m) }))
    .filter(({ market, edge }) => {
      if (edge.score < settings.min_edge_score) return false;
      if (openMarketIds.has(market.id)) return false;
      const days = daysToResolution(market);
      if (days !== null && (days < settings.min_days_to_resolution || days > settings.max_days_to_resolution)) return false;
      return true;
    })
    .sort((a, b) => b.edge.score - a.edge.score);

  // ── 4. Open new positions ─────────────────────────────────────────────────
  let tradesOpened = 0;
  let cashDeployed = 0;

  for (const { market, edge } of candidates) {
    if (tradesOpened >= slotsAvailable) break;
    if (availableCash < 1) break;

    const signal = pickSignal(market, settings);

    if (!signal) {
      decisions.push({ market_id: market.id, question: market.question, action: "skip", reason: "No signal for this strategy" });
      continue;
    }

    // Kelly sizing
    const rawKelly = kelly(signal.estimatedProb, signal.betPrice);

    if (rawKelly <= 0) {
      decisions.push({
        market_id: market.id,
        question: market.question,
        action: "skip",
        reason: `Negative Kelly (${rawKelly.toFixed(3)}) — no mathematical edge`,
      });
      continue;
    }

    const framedKelly = rawKelly * settings.kelly_fraction;
    const positionPct = Math.min(framedKelly, settings.max_position_pct);
    const cost = Math.min(availableCash * positionPct, availableCash);

    if (cost < 0.50) {
      decisions.push({ market_id: market.id, question: market.question, action: "skip", reason: "Position too small (<$0.50)" });
      continue;
    }

    const shares = cost / signal.betPrice;

    // Insert trade
    db.prepare(`
      INSERT INTO paper_trades
        (market_id, question, outcome, shares, entry_price, current_price,
         edge_score, edge_reason, notes, trade_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'paper')
    `).run(
      market.id,
      market.question,
      signal.outcome,
      parseFloat(shares.toFixed(4)),
      signal.betPrice,
      signal.betPrice,
      edge.score,
      edge.reasons.join("; "),
      `AUTO: ${signal.reason}`
    );

    // Deduct from bankroll
    db.prepare(`
      UPDATE bankroll
      SET current_balance = current_balance - ?, updated_at = datetime('now')
      WHERE trade_type = 'paper'
    `).run(cost);

    availableCash -= cost;
    cashDeployed += cost;
    tradesOpened++;

    decisions.push({
      market_id: market.id,
      question: market.question,
      action: "open",
      reason: signal.reason,
      outcome: signal.outcome,
      shares: parseFloat(shares.toFixed(4)),
      price: signal.betPrice,
      cost: parseFloat(cost.toFixed(2)),
      edge_score: edge.score,
    });
  }

  // Mark unscored candidates as skipped
  const openedIds = new Set(decisions.filter((d) => d.action === "open").map((d) => d.market_id));
  for (const { market } of candidates.slice(0, 20)) {
    if (!openedIds.has(market.id) && !decisions.find((d) => d.market_id === market.id)) {
      decisions.push({ market_id: market.id, question: market.question, action: "skip", reason: "Below position limit or insufficient cash" });
    }
  }

  // ── 5. Persist run record ─────────────────────────────────────────────────
  const totalReturned = closeDecisions.reduce((s, d) => {
    if (d.price && d.outcome) {
      // proceeds = shares * exit_price — we don't have shares here, just record pnl
    }
    return s + (d.pnl ?? 0);
  }, 0);

  db.prepare(`
    INSERT INTO autotrader_runs
      (markets_scanned, trades_opened, trades_closed, cash_deployed, cash_returned, settings_snapshot, decisions)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    markets.length,
    tradesOpened,
    closeDecisions.length,
    parseFloat(cashDeployed.toFixed(2)),
    parseFloat(totalReturned.toFixed(2)),
    JSON.stringify(settings),
    JSON.stringify(decisions)
  );

  return {
    markets_scanned: markets.length,
    trades_opened: tradesOpened,
    trades_closed: closeDecisions.length,
    cash_deployed: cashDeployed,
    cash_returned: totalReturned,
    decisions,
  };
}
