import type { KalshiMarket } from "@/types";

const KALSHI_BASE = "https://api.elections.kalshi.com/trade-api/v2";

export async function fetchKalshiMarkets(params: {
  limit?: number;
  cursor?: string;
  status?: string;
  tickers?: string;
  series_ticker?: string;
} = {}): Promise<{ markets: KalshiMarket[]; cursor?: string }> {
  const query = new URLSearchParams({ limit: String(params.limit ?? 100) });
  if (params.status) query.set("status", params.status);
  if (params.cursor) query.set("cursor", params.cursor);
  if (params.tickers) query.set("tickers", params.tickers);
  if (params.series_ticker) query.set("series_ticker", params.series_ticker);

  const res = await fetch(`${KALSHI_BASE}/markets?${query}`, {
    next: { revalidate: 120 },
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    console.error("Kalshi API error", res.status, await res.text());
    return { markets: [] };
  }

  const data = await res.json();
  return {
    markets: (data.markets ?? []).map(normalizeKalshi),
    cursor: data.cursor,
  };
}

function normalizeKalshi(m: Record<string, unknown>): KalshiMarket {
  return {
    ticker: String(m.ticker ?? ""),
    title: String(m.title ?? ""),
    yes_ask: Number(m.yes_ask ?? 0) / 100,
    yes_bid: Number(m.yes_bid ?? 0) / 100,
    no_ask: Number(m.no_ask ?? 0) / 100,
    no_bid: Number(m.no_bid ?? 0) / 100,
    volume: Number(m.volume ?? 0),
    open_interest: Number(m.open_interest ?? 0),
    status: String(m.status ?? ""),
  };
}

// Compute mid-price from bid/ask
export function kalshiYesMid(m: KalshiMarket): number {
  if (m.yes_bid > 0 && m.yes_ask > 0) return (m.yes_bid + m.yes_ask) / 2;
  if (m.yes_bid > 0) return m.yes_bid;
  if (m.yes_ask > 0) return m.yes_ask;
  return 0;
}

// Tokenize a string into lowercase words for fuzzy matching
function tokenize(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );
}

// Returns a Jaccard similarity [0,1] between two strings
export function stringSimilarity(a: string, b: string): number {
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let intersection = 0;
  ta.forEach((w) => { if (tb.has(w)) intersection++; });
  const union = new Set([...ta, ...tb]).size;
  return intersection / union;
}
