import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { fetchMarket, getYesPrice, computeEdgeScore } from "@/lib/polymarket";
import type { Bankroll } from "@/types";

// GET /api/trades?type=paper|real|all
export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get("type") ?? "all";
    const db = getDb();
    const trades =
      type === "all"
        ? db.prepare("SELECT * FROM paper_trades ORDER BY opened_at DESC").all()
        : db.prepare("SELECT * FROM paper_trades WHERE trade_type = ? ORDER BY opened_at DESC").all(type);
    return NextResponse.json({ trades });
  } catch (err) {
    console.error("Trades GET error:", err);
    return NextResponse.json({ error: "Failed to load trades" }, { status: 500 });
  }
}

// POST /api/trades — open a new trade (paper or real)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      market_id,
      outcome,
      shares,
      notes,
      trade_type = "paper",
      // Real trades can supply a manual entry price (user already placed the trade)
      manual_entry_price,
      manual_question,
    } = body;

    if (!market_id || !outcome || !shares) {
      return NextResponse.json({ error: "market_id, outcome, and shares required" }, { status: 400 });
    }
    if (!["YES", "NO"].includes(outcome)) {
      return NextResponse.json({ error: "outcome must be YES or NO" }, { status: 400 });
    }
    if (!["paper", "real"].includes(trade_type)) {
      return NextResponse.json({ error: "trade_type must be paper or real" }, { status: 400 });
    }
    if (shares <= 0) {
      return NextResponse.json({ error: "shares must be positive" }, { status: 400 });
    }

    const db = getDb();

    // Determine entry price
    let entryPrice: number;
    let question: string;
    let edgeScore: number | null = null;
    let edgeReason: string | null = null;

    if (manual_entry_price != null && manual_question) {
      // Real trade logged manually — no live fetch needed
      entryPrice = Number(manual_entry_price);
      question = manual_question;
      if (entryPrice <= 0 || entryPrice >= 1) {
        return NextResponse.json({ error: "entry_price must be between 0 and 1" }, { status: 400 });
      }
    } else {
      // Fetch live price from Polymarket
      const market = await fetchMarket(market_id);
      const yesPrice = getYesPrice(market);
      entryPrice = outcome === "YES" ? yesPrice : 1 - yesPrice;
      question = market.question;
      const edge = computeEdgeScore(market);
      edgeScore = edge.score;
      edgeReason = edge.reasons.join("; ");
    }

    const cost = shares * entryPrice;

    // Check and deduct from bankroll
    const bankroll = db.prepare("SELECT * FROM bankroll WHERE trade_type = ?").get(trade_type) as Bankroll | undefined;
    if (bankroll && bankroll.current_balance < cost) {
      return NextResponse.json({
        error: `Insufficient ${trade_type} bankroll. Available: $${bankroll.current_balance.toFixed(2)}, needed: $${cost.toFixed(2)}`,
      }, { status: 400 });
    }

    // Insert trade
    const result = db.prepare(`
      INSERT INTO paper_trades
        (market_id, question, outcome, shares, entry_price, current_price,
         edge_score, edge_reason, notes, trade_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      market_id, question, outcome, shares, entryPrice, entryPrice,
      edgeScore, edgeReason, notes ?? null, trade_type
    );

    // Deduct from bankroll
    if (bankroll) {
      db.prepare(`
        UPDATE bankroll
        SET current_balance = current_balance - ?, updated_at = datetime('now')
        WHERE trade_type = ?
      `).run(cost, trade_type);
    }

    // Record price snapshot (only for paper / live price)
    if (!manual_entry_price) {
      const yesPrice = outcome === "YES" ? entryPrice : 1 - entryPrice;
      db.prepare(
        "INSERT INTO price_snapshots (market_id, yes_price, no_price, volume) VALUES (?,?,?,0)"
      ).run(market_id, yesPrice, 1 - yesPrice);
    }

    return NextResponse.json({
      id: result.lastInsertRowid,
      entry_price: entryPrice,
      edge_score: edgeScore,
      message: `${trade_type === "real" ? "Real" : "Paper"} trade opened`,
    });
  } catch (err) {
    console.error("Trades POST error:", err);
    return NextResponse.json({ error: "Failed to open trade" }, { status: 500 });
  }
}
