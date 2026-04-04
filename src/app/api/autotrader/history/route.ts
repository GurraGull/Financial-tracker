import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { AutoTraderRun } from "@/types";

export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 20);
  const db = getDb();

  const runs = db.prepare(
    "SELECT * FROM autotrader_runs ORDER BY ran_at DESC LIMIT ?"
  ).all(limit) as AutoTraderRun[];

  // Summary stats across all runs
  const totals = db.prepare(`
    SELECT
      COUNT(*)           AS total_runs,
      SUM(trades_opened) AS total_opened,
      SUM(trades_closed) AS total_closed,
      SUM(cash_deployed) AS total_deployed
    FROM autotrader_runs
  `).get() as {
    total_runs: number;
    total_opened: number;
    total_closed: number;
    total_deployed: number;
  };

  // Auto-trade performance (closed auto-trades only)
  const perf = db.prepare(`
    SELECT
      COUNT(*)                                         AS total,
      SUM(CASE WHEN exit_price > entry_price THEN 1 ELSE 0 END) AS wins,
      SUM((exit_price - entry_price) * shares)        AS total_pnl
    FROM paper_trades
    WHERE trade_type = 'paper'
      AND status = 'closed'
      AND notes LIKE 'AUTO:%'
  `).get() as { total: number; wins: number; total_pnl: number };

  return NextResponse.json({ runs, totals, perf });
}
