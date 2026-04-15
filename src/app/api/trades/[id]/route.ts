import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { fetchMarket, getYesPrice } from "@/lib/polymarket";

type TradeRow = {
  status: string;
  market_id: string;
  outcome: string;
  entry_price: number;
  shares: number;
  trade_type: string;
};

function returnProceedsToBankroll(
  db: ReturnType<typeof getDb>,
  trade: TradeRow,
  exitPrice: number
) {
  const proceeds = trade.shares * exitPrice;
  db.prepare(`
    UPDATE bankroll
    SET current_balance = current_balance + ?, updated_at = datetime('now')
    WHERE trade_type = ?
  `).run(proceeds, trade.trade_type);
}

// PATCH /api/trades/:id — close, resolve, or update notes
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const db = getDb();

    const trade = db.prepare("SELECT * FROM paper_trades WHERE id = ?").get(Number(id)) as TradeRow | undefined;
    if (!trade) return NextResponse.json({ error: "Trade not found" }, { status: 404 });

    if (body.action === "close") {
      if (trade.status === "closed") {
        return NextResponse.json({ error: "Trade already closed" }, { status: 400 });
      }

      let exitPrice: number;
      if (body.manual_exit_price != null) {
        exitPrice = Number(body.manual_exit_price);
      } else {
        const market = await fetchMarket(trade.market_id);
        const yesPrice = getYesPrice(market);
        exitPrice = trade.outcome === "YES" ? yesPrice : 1 - yesPrice;
      }

      db.prepare(`
        UPDATE paper_trades
        SET status = 'closed', exit_price = ?, current_price = ?, closed_at = datetime('now')
        WHERE id = ?
      `).run(exitPrice, exitPrice, Number(id));

      returnProceedsToBankroll(db, trade, exitPrice);
      return NextResponse.json({ exit_price: exitPrice, message: "Trade closed" });
    }

    if (body.action === "resolve") {
      const { resolved_yes } = body;
      const outcomePrice = resolved_yes ? 1.0 : 0.0;
      const exitPrice = trade.outcome === "YES" ? outcomePrice : 1 - outcomePrice;

      db.prepare(`
        UPDATE paper_trades
        SET status = 'closed', exit_price = ?, current_price = ?,
            closed_at = datetime('now'), resolved = 1, resolved_yes = ?
        WHERE id = ?
      `).run(exitPrice, exitPrice, resolved_yes ? 1 : 0, Number(id));

      returnProceedsToBankroll(db, trade, exitPrice);
      return NextResponse.json({ message: "Trade resolved" });
    }

    if (body.notes !== undefined) {
      db.prepare("UPDATE paper_trades SET notes = ? WHERE id = ?").run(body.notes, Number(id));
      return NextResponse.json({ message: "Notes updated" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("Trade PATCH error:", err);
    return NextResponse.json({ error: "Failed to update trade" }, { status: 500 });
  }
}

// DELETE /api/trades/:id — refund open trade to bankroll, then delete
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const trade = db.prepare("SELECT * FROM paper_trades WHERE id = ?").get(Number(id)) as TradeRow | undefined;

  if (trade && trade.status === "open") {
    // Refund the invested amount back to bankroll
    const refund = trade.shares * trade.entry_price;
    db.prepare(`
      UPDATE bankroll
      SET current_balance = current_balance + ?, updated_at = datetime('now')
      WHERE trade_type = ?
    `).run(refund, trade.trade_type);
  }

  db.prepare("DELETE FROM paper_trades WHERE id = ?").run(Number(id));
  return NextResponse.json({ message: "Trade deleted" });
}
