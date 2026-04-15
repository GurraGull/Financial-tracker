import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { fetchMarket, getYesPrice } from "@/lib/polymarket";
import type { PaperTrade, PortfolioStats, Bankroll } from "@/types";

function computeStats(trades: PaperTrade[], bankroll: Bankroll): PortfolioStats {
  let total_invested = 0;
  let current_value = 0;
  let realized_pnl = 0;
  let wins = 0;
  let closed_count = 0;

  for (const t of trades) {
    const invested = t.shares * t.entry_price;
    total_invested += invested;

    if (t.status === "open") {
      const curr = t.current_price ?? t.entry_price;
      current_value += t.shares * curr;
    } else {
      const exit = t.exit_price ?? t.entry_price;
      const pnl = t.shares * (exit - t.entry_price);
      realized_pnl += pnl;
      current_value += t.shares * exit;
      closed_count++;
      if (pnl > 0) wins++;
    }
  }

  const open_positions = trades.filter((t) => t.status === "open").length;
  const unrealized_pnl = current_value - total_invested - realized_pnl;
  const total_pnl = realized_pnl + unrealized_pnl;
  const roi_pct = bankroll.starting_balance > 0
    ? (total_pnl / bankroll.starting_balance) * 100
    : 0;

  return {
    total_invested,
    current_value,
    realized_pnl,
    unrealized_pnl,
    total_pnl,
    win_rate: closed_count > 0 ? wins / closed_count : 0,
    open_positions,
    closed_positions: closed_count,
    total_trades: trades.length,
    cash_available: bankroll.current_balance,
    starting_balance: bankroll.starting_balance,
    roi_pct,
  };
}

export async function GET(req: NextRequest) {
  try {
    const tradeType = req.nextUrl.searchParams.get("type") ?? "paper";
    const db = getDb();

    const trades = db.prepare(
      "SELECT * FROM paper_trades WHERE trade_type = ? ORDER BY opened_at DESC"
    ).all(tradeType) as PaperTrade[];

    const bankroll = db.prepare(
      "SELECT * FROM bankroll WHERE trade_type = ?"
    ).get(tradeType) as Bankroll;

    // Update current prices for open trades in parallel
    const openTrades = trades.filter((t) => t.status === "open");
    await Promise.all(
      openTrades.map(async (trade) => {
        try {
          const market = await fetchMarket(trade.market_id);
          const yesPrice = getYesPrice(market);
          const currentPrice = trade.outcome === "YES" ? yesPrice : 1 - yesPrice;
          db.prepare("UPDATE paper_trades SET current_price = ? WHERE id = ?").run(currentPrice, trade.id);
          db.prepare(
            "INSERT INTO price_snapshots (market_id, yes_price, no_price, volume) VALUES (?,?,?,?)"
          ).run(trade.market_id, yesPrice, 1 - yesPrice, market.volume ?? 0);
          trade.current_price = currentPrice;
        } catch {
          // Market may have closed — keep last known price
        }
      })
    );

    const stats = computeStats(trades, bankroll);
    const updatedTrades = db.prepare(
      "SELECT * FROM paper_trades WHERE trade_type = ? ORDER BY opened_at DESC"
    ).all(tradeType);

    return NextResponse.json({ stats, trades: updatedTrades, bankroll });
  } catch (err) {
    console.error("Portfolio error:", err);
    return NextResponse.json({ error: "Failed to load portfolio" }, { status: 500 });
  }
}
