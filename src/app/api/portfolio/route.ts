import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { fetchMarket, getYesPrice } from "@/lib/polymarket";
import type { PaperTrade, PortfolioStats } from "@/types";

export async function GET() {
  try {
    const db = getDb();
    const trades = db.prepare("SELECT * FROM paper_trades ORDER BY opened_at DESC").all() as PaperTrade[];

    // Update current prices for open trades
    const openTrades = trades.filter((t) => t.status === "open");
    await Promise.all(
      openTrades.map(async (trade) => {
        try {
          const market = await fetchMarket(trade.market_id);
          const yesPrice = getYesPrice(market);
          const currentPrice = trade.outcome === "YES" ? yesPrice : 1 - yesPrice;
          db.prepare("UPDATE paper_trades SET current_price = ? WHERE id = ?").run(
            currentPrice,
            trade.id
          );
          db.prepare(
            "INSERT INTO price_snapshots (market_id, yes_price, no_price, volume) VALUES (?,?,?,?)"
          ).run(trade.market_id, yesPrice, 1 - yesPrice, market.volume ?? 0);
          trade.current_price = currentPrice;
        } catch {
          // Market may have closed — keep last known price
        }
      })
    );

    // Compute stats
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

    const unrealized_pnl = current_value - total_invested - realized_pnl;

    const stats: PortfolioStats = {
      total_invested,
      current_value,
      realized_pnl,
      unrealized_pnl,
      total_pnl: realized_pnl + unrealized_pnl,
      win_rate: closed_count > 0 ? wins / closed_count : 0,
      open_positions: openTrades.length,
      closed_positions: closed_count,
      total_trades: trades.length,
    };

    const updatedTrades = db.prepare("SELECT * FROM paper_trades ORDER BY opened_at DESC").all();
    return NextResponse.json({ stats, trades: updatedTrades });
  } catch (err) {
    console.error("Portfolio error:", err);
    return NextResponse.json({ error: "Failed to load portfolio" }, { status: 500 });
  }
}
