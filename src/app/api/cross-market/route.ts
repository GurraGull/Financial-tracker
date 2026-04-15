import { NextRequest, NextResponse } from "next/server";
import { fetchMarkets, getYesPrice } from "@/lib/polymarket";
import { fetchKalshiMarkets, kalshiYesMid, stringSimilarity } from "@/lib/kalshi";
import type { CrossMarketMatch } from "@/types";

const SIMILARITY_THRESHOLD = 0.15;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const limit = Number(searchParams.get("limit") ?? 50);

    // Fetch both markets in parallel
    const [polymarkets, kalshiResult] = await Promise.all([
      fetchMarkets({ limit, active: true, closed: false, order: "volume24hr" }),
      fetchKalshiMarkets({ limit: 200, status: "open" }),
    ]);

    const kalshiMarkets = kalshiResult.markets.filter((k) => kalshiYesMid(k) > 0);
    const matches: CrossMarketMatch[] = [];

    for (const poly of polymarkets) {
      const polyPrice = getYesPrice(poly);
      if (polyPrice <= 0) continue;

      let bestMatch = null;
      let bestScore = SIMILARITY_THRESHOLD;

      for (const kalshi of kalshiMarkets) {
        const sim = stringSimilarity(poly.question, kalshi.title);
        if (sim > bestScore) {
          bestScore = sim;
          bestMatch = kalshi;
        }
      }

      if (bestMatch) {
        const kalshiMid = kalshiYesMid(bestMatch);
        const delta = kalshiMid - polyPrice;

        // Only surface meaningful discrepancies (>2%)
        if (Math.abs(delta) >= 0.02) {
          matches.push({
            kalshi_ticker: bestMatch.ticker,
            kalshi_title: bestMatch.title,
            kalshi_yes_mid: kalshiMid,
            poly_yes_price: polyPrice,
            delta_pct: delta,
            poly_market_id: poly.id,
            poly_question: poly.question,
          });
        }
      }
    }

    // Sort by absolute delta descending (biggest discrepancies first)
    matches.sort((a, b) => Math.abs(b.delta_pct) - Math.abs(a.delta_pct));

    return NextResponse.json({ matches, count: matches.length });
  } catch (err) {
    console.error("Cross-market error:", err);
    return NextResponse.json({ error: "Failed to fetch cross-market data" }, { status: 500 });
  }
}
