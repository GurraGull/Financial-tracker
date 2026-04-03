import { NextRequest, NextResponse } from "next/server";
import { fetchMarkets, computeEdgeScore, getYesPrice, getNoPrice } from "@/lib/polymarket";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const limit = Number(searchParams.get("limit") ?? 50);
    const offset = Number(searchParams.get("offset") ?? 0);
    const tag = searchParams.get("tag") ?? undefined;
    const order = searchParams.get("order") ?? "volume24hr";

    const markets = await fetchMarkets({ limit, offset, tag, order, active: true, closed: false });

    const scored = markets.map((m) => ({
      ...m,
      yes_price: getYesPrice(m),
      no_price: getNoPrice(m),
      edge: computeEdgeScore(m),
    }));

    // Sort by edge score descending
    scored.sort((a, b) => b.edge.score - a.edge.score);

    return NextResponse.json({ markets: scored, total: scored.length });
  } catch (err) {
    console.error("Markets API error:", err);
    return NextResponse.json({ error: "Failed to fetch markets" }, { status: 500 });
  }
}
