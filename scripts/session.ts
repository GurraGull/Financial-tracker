/**
 * 5-Hour Auto-Trader Session
 *
 * Runs the auto-trader every 30 minutes, learns after each run,
 * and prints a live log to the console.
 *
 * Usage:
 *   npx tsx --tsconfig tsconfig.json scripts/session.ts
 */

import { runAutoTrader, learnAndAdapt } from "../src/lib/autotrader";
import { getDb } from "../src/lib/db";

// ─── Config ───────────────────────────────────────────────────────────────────

const SESSION_DURATION_MS = 5 * 60 * 60 * 1000; // 5 hours
const RUN_INTERVAL_MS     = 10 * 60 * 1000;      // every 10 minutes (sim runs instantly)
const SESSION_START       = Date.now();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function elapsed(): string {
  const ms  = Date.now() - SESSION_START;
  const h   = Math.floor(ms / 3_600_000);
  const m   = Math.floor((ms % 3_600_000) / 60_000);
  const s   = Math.floor((ms % 60_000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function banner(text: string) {
  const line = "─".repeat(60);
  console.log(`\n${line}`);
  console.log(`  ${text}`);
  console.log(line);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Main loop ────────────────────────────────────────────────────────────────

async function runSession() {
  banner(`AUTO-TRADER SESSION STARTED  [duration: 5h, interval: 10m]`);
  console.log(`  Start time : ${new Date().toLocaleString()}`);
  console.log(`  End time   : ${new Date(SESSION_START + SESSION_DURATION_MS).toLocaleString()}`);

  let runNumber = 0;

  while (Date.now() - SESSION_START < SESSION_DURATION_MS) {
    runNumber++;
    banner(`RUN #${runNumber}  [+${elapsed()}]`);

    // ── Trade ─────────────────────────────────────────────────────────────
    console.log("  Scanning markets and executing trades...");
    let result;
    try {
      result = await runAutoTrader();
    } catch (err) {
      console.error("  ERROR during run:", err);
      console.log(`  Retrying in ${RUN_INTERVAL_MS / 60000}m...`);
      await sleep(RUN_INTERVAL_MS);
      continue;
    }

    const modeTag = result.sim_mode ? " [SIM]" : " [LIVE]";
    console.log(`  Mode            :${modeTag}`);
    console.log(`  Markets scanned : ${result.markets_scanned}`);
    console.log(`  Trades opened   : ${result.trades_opened}`);
    console.log(`  Trades closed   : ${result.trades_closed}`);
    console.log(`  Cash deployed   : $${result.cash_deployed.toFixed(2)}`);

    // Print decisions
    const opens  = result.decisions.filter((d) => d.action === "open");
    const closes = result.decisions.filter((d) => d.action === "close");

    if (opens.length > 0) {
      console.log("\n  OPENED:");
      for (const d of opens) {
        console.log(`    [${d.outcome}] ${d.question.slice(0, 60)}…`);
        console.log(`         ${d.reason}  |  $${d.cost?.toFixed(2)} @ ${((d.price ?? 0) * 100).toFixed(1)}¢  edge=${d.edge_score}`);
      }
    }

    if (closes.length > 0) {
      console.log("\n  CLOSED:");
      for (const d of closes) {
        const pnl = d.pnl ?? 0;
        const sign = pnl >= 0 ? "+" : "";
        console.log(`    [${d.outcome}] ${d.question.slice(0, 60)}…`);
        console.log(`         ${d.reason}  |  P&L: ${sign}$${pnl.toFixed(2)}`);
      }
    }

    // ── Learn ─────────────────────────────────────────────────────────────
    console.log("\n  Running learning / adaptation...");
    let insight;
    try {
      insight = learnAndAdapt(getDb());
    } catch (err) {
      console.error("  ERROR during learning:", err);
      insight = null;
    }

    if (insight) {
      console.log(`  Fade win rate  : ${insight.fade_win_rate  !== null ? `${(insight.fade_win_rate  * 100).toFixed(0)}%` : "n/a (< 2 trades)"}`);
      console.log(`  Spike win rate : ${insight.spike_win_rate !== null ? `${(insight.spike_win_rate * 100).toFixed(0)}%` : "n/a (< 2 trades)"}`);
      console.log(`  Avg open P&L   : ${(insight.avg_unrealized_pnl_pct * 100).toFixed(1)}%`);
      console.log(`  Stop-losses    : ${insight.recent_stop_losses}  |  Take-profits: ${insight.recent_take_profits}`);

      if (Object.keys(insight.adjustments).length > 0) {
        console.log("\n  ADJUSTMENTS APPLIED:");
        for (const note of insight.notes) {
          console.log(`    → ${note}`);
        }
      } else {
        console.log(`  No adjustments: ${insight.notes[0]}`);
      }
    }

    // ── Portfolio snapshot ─────────────────────────────────────────────────
    const db = getDb();
    const bankroll = db.prepare(
      "SELECT current_balance, starting_balance FROM bankroll WHERE trade_type='paper'"
    ).get() as { current_balance: number; starting_balance: number } | undefined;

    const openCount = (db.prepare(
      "SELECT COUNT(*) as c FROM paper_trades WHERE status='open' AND trade_type='paper' AND notes LIKE 'AUTO:%'"
    ).get() as { c: number }).c;

    const totalPnl = (db.prepare(`
      SELECT COALESCE(SUM((exit_price - entry_price) * shares), 0) as pnl
      FROM paper_trades
      WHERE trade_type='paper' AND status='closed' AND notes LIKE 'AUTO:%'
    `).get() as { pnl: number }).pnl;

    if (bankroll) {
      const roi = ((bankroll.starting_balance - bankroll.current_balance + (bankroll.current_balance - bankroll.starting_balance === 0 ? 0 : 0) + totalPnl) / bankroll.starting_balance) * 100;
      console.log(`\n  PORTFOLIO  cash=$${bankroll.current_balance.toFixed(2)}  open=${openCount}  realized P&L=$${totalPnl.toFixed(2)}`);
    }

    // ── Wait for next run ──────────────────────────────────────────────────
    const remaining = SESSION_DURATION_MS - (Date.now() - SESSION_START);
    if (remaining <= 0) break;

    const waitMs = Math.min(RUN_INTERVAL_MS, remaining);
    const nextRun = new Date(Date.now() + waitMs);
    console.log(`\n  Next run: ${nextRun.toLocaleTimeString()}  (in ${Math.round(waitMs / 60000)}m)`);

    await sleep(waitMs);
  }

  // ── Session complete ───────────────────────────────────────────────────────
  banner("SESSION COMPLETE");

  const db = getDb();
  const finalBankroll = db.prepare(
    "SELECT current_balance, starting_balance FROM bankroll WHERE trade_type='paper'"
  ).get() as { current_balance: number; starting_balance: number };

  const allAutoTrades = db.prepare(`
    SELECT COUNT(*) as total,
           SUM(CASE WHEN status='closed' AND exit_price > entry_price THEN 1 ELSE 0 END) as wins,
           SUM(CASE WHEN status='closed' THEN 1 ELSE 0 END) as closed,
           SUM(CASE WHEN status='open'   THEN 1 ELSE 0 END) as open_count,
           SUM(CASE WHEN status='closed' THEN (exit_price - entry_price) * shares ELSE 0 END) as realized_pnl
    FROM paper_trades
    WHERE trade_type='paper' AND notes LIKE 'AUTO:%'
  `).get() as { total: number; wins: number; closed: number; open_count: number; realized_pnl: number };

  const settings = db.prepare("SELECT * FROM autotrader_settings WHERE id=1").get() as { strategy: string; kelly_fraction: number; min_edge_score: number; fade_threshold_high: number; stop_loss_pct: number };

  console.log(`  Total auto-trades   : ${allAutoTrades.total}`);
  console.log(`  Closed              : ${allAutoTrades.closed}  (${allAutoTrades.open_count} still open)`);
  console.log(`  Win rate            : ${allAutoTrades.closed > 0 ? `${((allAutoTrades.wins / allAutoTrades.closed) * 100).toFixed(0)}%` : "n/a"} (${allAutoTrades.wins}/${allAutoTrades.closed})`);
  console.log(`  Realized P&L        : $${(allAutoTrades.realized_pnl ?? 0).toFixed(2)}`);
  console.log(`  Cash remaining      : $${finalBankroll.current_balance.toFixed(2)}`);
  console.log(`\n  Final settings (after learning):`);
  console.log(`    Strategy          : ${settings.strategy}`);
  console.log(`    Kelly fraction    : ${settings.kelly_fraction}`);
  console.log(`    Min edge score    : ${settings.min_edge_score}`);
  console.log(`    Fade threshold    : >${(settings.fade_threshold_high * 100).toFixed(0)}%`);
  console.log(`    Stop loss         : ${(settings.stop_loss_pct * 100).toFixed(0)}%`);
  console.log(`\n  Done. Results are stored in paper_trades.db`);
  console.log(`  Open the dashboard (npm run dev) to view full history.\n`);
}

runSession().catch((err) => {
  console.error("Session failed:", err);
  process.exit(1);
});
