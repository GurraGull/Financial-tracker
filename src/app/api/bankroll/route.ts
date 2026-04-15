import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { Bankroll } from "@/types";

// GET /api/bankroll — return both bankrolls
export async function GET() {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM bankroll").all() as Bankroll[];
  return NextResponse.json({ bankrolls: rows });
}

// PATCH /api/bankroll — update starting balance for a type
export async function PATCH(req: NextRequest) {
  const { trade_type, starting_balance } = await req.json();
  if (!["paper", "real"].includes(trade_type)) {
    return NextResponse.json({ error: "trade_type must be paper or real" }, { status: 400 });
  }
  if (typeof starting_balance !== "number" || starting_balance <= 0) {
    return NextResponse.json({ error: "starting_balance must be a positive number" }, { status: 400 });
  }

  const db = getDb();

  // Recalculate current_balance = starting + all closed P&L - all open invested
  const trades = db.prepare(
    "SELECT shares, entry_price, exit_price, status FROM paper_trades WHERE trade_type = ?"
  ).all(trade_type) as Array<{ shares: number; entry_price: number; exit_price: number | null; status: string }>;

  let cash = starting_balance;
  for (const t of trades) {
    if (t.status === "open") {
      cash -= t.shares * t.entry_price;
    } else {
      const pnl = t.shares * ((t.exit_price ?? t.entry_price) - t.entry_price);
      cash += pnl; // open cost was already deducted; on close we return shares*exit_price
      // Actually: cash flow = -entry cost (on open) + exit_proceeds (on close)
      // Net effect on balance from this closed trade: shares*(exit-entry)
    }
  }

  db.prepare(`
    UPDATE bankroll
    SET starting_balance = ?, current_balance = ?, updated_at = datetime('now')
    WHERE trade_type = ?
  `).run(starting_balance, cash, trade_type);

  const updated = db.prepare("SELECT * FROM bankroll WHERE trade_type = ?").get(trade_type) as Bankroll;
  return NextResponse.json({ bankroll: updated });
}
