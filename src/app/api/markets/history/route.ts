import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { fetchPriceHistory, fetchMarket } from "@/lib/polymarket";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const marketId = searchParams.get("market_id");
    if (!marketId) return NextResponse.json({ error: "market_id required" }, { status: 400 });

    // Local snapshots
    const db = getDb();
    const local = db.prepare(`
      SELECT yes_price, no_price, volume, recorded_at
      FROM price_snapshots WHERE market_id = ?
      ORDER BY recorded_at ASC
    `).all(marketId) as Array<{ yes_price: number; no_price: number; volume: number | null; recorded_at: string }>;

    // External CLOB history for YES token
    let clobHistory: Array<{ t: number; p: number }> = [];
    try {
      const market = await fetchMarket(marketId);
      const yesToken = market.tokens.find((t) => t.outcome.toUpperCase() === "YES");
      if (yesToken) {
        clobHistory = await fetchPriceHistory(yesToken.token_id, 60);
      }
    } catch {
      // fall back to local only
    }

    return NextResponse.json({
      local_snapshots: local,
      clob_history: clobHistory,
    });
  } catch (err) {
    console.error("History error:", err);
    return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
  }
}
