import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { fetchMarket, getYesPrice } from "@/lib/polymarket";

// PATCH /api/trades/:id — close trade or update notes
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const db = getDb();

    const trade = db.prepare("SELECT * FROM paper_trades WHERE id = ?").get(Number(id)) as
      | { status: string; market_id: string; outcome: string; entry_price: number } | undefined;

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    if (body.action === "close") {
      if (trade.status === "closed") {
        return NextResponse.json({ error: "Trade already closed" }, { status: 400 });
      }
      // Fetch current price
      const market = await fetchMarket(trade.market_id);
      const yesPrice = getYesPrice(market);
      const exitPrice = trade.outcome === "YES" ? yesPrice : 1 - yesPrice;

      db.prepare(`
        UPDATE paper_trades
        SET status = 'closed', exit_price = ?, current_price = ?, closed_at = datetime('now')
        WHERE id = ?
      `).run(exitPrice, exitPrice, Number(id));

      return NextResponse.json({ exit_price: exitPrice, message: "Trade closed" });
    }

    if (body.action === "resolve") {
      const { resolved_yes } = body;
      const exitPrice = resolved_yes ? 1.0 : 0.0;
      const tradeExitPrice = trade.outcome === "YES" ? exitPrice : 1 - exitPrice;

      db.prepare(`
        UPDATE paper_trades
        SET status = 'closed', exit_price = ?, current_price = ?,
            closed_at = datetime('now'), resolved = 1, resolved_yes = ?
        WHERE id = ?
      `).run(tradeExitPrice, tradeExitPrice, resolved_yes ? 1 : 0, Number(id));

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

// DELETE /api/trades/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  db.prepare("DELETE FROM paper_trades WHERE id = ?").run(Number(id));
  return NextResponse.json({ message: "Trade deleted" });
}
