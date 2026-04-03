import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { fetchMarket, getYesPrice, computeEdgeScore } from "@/lib/polymarket";

// GET /api/trades — list all paper trades
export async function GET() {
  try {
    const db = getDb();
    const trades = db.prepare(`
      SELECT * FROM paper_trades ORDER BY opened_at DESC
    `).all();
    return NextResponse.json({ trades });
  } catch (err) {
    console.error("Trades GET error:", err);
    return NextResponse.json({ error: "Failed to load trades" }, { status: 500 });
  }
}

// POST /api/trades — open a new paper trade
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { market_id, outcome, shares, notes } = body;

    if (!market_id || !outcome || !shares) {
      return NextResponse.json({ error: "market_id, outcome, and shares required" }, { status: 400 });
    }
    if (!["YES", "NO"].includes(outcome)) {
      return NextResponse.json({ error: "outcome must be YES or NO" }, { status: 400 });
    }
    if (shares <= 0) {
      return NextResponse.json({ error: "shares must be positive" }, { status: 400 });
    }

    // Fetch live price
    const market = await fetchMarket(market_id);
    const yesPrice = getYesPrice(market);
    const entryPrice = outcome === "YES" ? yesPrice : 1 - yesPrice;
    const edge = computeEdgeScore(market);

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO paper_trades
        (market_id, question, outcome, shares, entry_price, current_price, edge_score, edge_reason, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      market_id,
      market.question,
      outcome,
      shares,
      entryPrice,
      entryPrice,
      edge.score,
      edge.reasons.join("; "),
      notes ?? null
    );

    // Record price snapshot
    db.prepare(`
      INSERT INTO price_snapshots (market_id, yes_price, no_price, volume)
      VALUES (?, ?, ?, ?)
    `).run(market_id, yesPrice, 1 - yesPrice, market.volume ?? 0);

    return NextResponse.json({
      id: result.lastInsertRowid,
      entry_price: entryPrice,
      edge_score: edge.score,
      message: "Paper trade opened",
    });
  } catch (err) {
    console.error("Trades POST error:", err);
    return NextResponse.json({ error: "Failed to open trade" }, { status: 500 });
  }
}
