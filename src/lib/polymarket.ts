import type { PolymarketMarket, EdgeScore } from "@/types";

const GAMMA_API = "https://gamma-api.polymarket.com";
const CLOB_API = "https://clob.polymarket.com";

// Fetch active markets with pagination
export async function fetchMarkets(params: {
  limit?: number;
  offset?: number;
  active?: boolean;
  closed?: boolean;
  tag?: string;
  order?: string;
  ascending?: boolean;
} = {}): Promise<PolymarketMarket[]> {
  const {
    limit = 50,
    offset = 0,
    active = true,
    closed = false,
    tag,
    order = "volume24hr",
    ascending = false,
  } = params;

  const query = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    active: String(active),
    closed: String(closed),
    order,
    ascending: String(ascending),
  });

  if (tag) query.set("tag", tag);

  const res = await fetch(`${GAMMA_API}/markets?${query}`, {
    next: { revalidate: 60 },
    headers: { Accept: "application/json" },
  });

  if (!res.ok) throw new Error(`Gamma API error: ${res.status}`);
  return res.json();
}

// Fetch a single market by ID
export async function fetchMarket(marketId: string): Promise<PolymarketMarket> {
  const res = await fetch(`${GAMMA_API}/markets/${marketId}`, {
    next: { revalidate: 30 },
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Market not found: ${marketId}`);
  return res.json();
}

// Fetch recent price/trade data from CLOB for a token
export async function fetchPriceHistory(tokenId: string, fidelity: number = 60): Promise<
  Array<{ t: number; p: number }>
> {
  try {
    const res = await fetch(
      `${CLOB_API}/prices-history?market=${tokenId}&fidelity=${fidelity}`,
      { next: { revalidate: 120 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.history ?? [];
  } catch {
    return [];
  }
}

// Extract YES price from market tokens
export function getYesPrice(market: PolymarketMarket): number {
  const yes = market.tokens.find(
    (t) => t.outcome.toUpperCase() === "YES"
  );
  return yes?.price ?? 0.5;
}

export function getNoPrice(market: PolymarketMarket): number {
  const no = market.tokens.find(
    (t) => t.outcome.toUpperCase() === "NO"
  );
  return no?.price ?? 0.5;
}

// Days until market resolves
export function daysToResolution(market: PolymarketMarket): number | null {
  const endDate = market.end_date_iso || market.game_start_time;
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, diff / (1000 * 60 * 60 * 24));
}

// -------------------------------------------------------------------
// EDGE SCORING ALGORITHM
//
// Scores a market 0-100 for "research interest" — how likely it is
// that the market is mispriced and offers edge. Higher = more edge.
//
// Factors:
//   1. Uncertainty bonus   – prices near 50% have highest entropy
//   2. Volume spike        – unusual 24h volume vs. total (news catalyst?)
//   3. Price movement      – large recent moves = possible overreaction
//   4. Resolution window   – 2-14 days is sweet spot (not too far, not expired)
//   5. Spread width        – YES + NO < 1 means liquidity gap = opportunity
//   6. Low absolute volume – thin markets are less efficient
// -------------------------------------------------------------------
export function computeEdgeScore(market: PolymarketMarket): EdgeScore {
  const yesPrice = getYesPrice(market);
  const noPrice = getNoPrice(market);
  const volume = market.volume ?? 0;
  const volume24h = market.volume_24hr ?? 0;
  const liquidity = market.liquidity ?? 0;
  const days = daysToResolution(market);

  // 1. Uncertainty bonus: peaks at 0.5 price, drops off at extremes
  const uncertainty = 1 - Math.abs(yesPrice - 0.5) * 2;

  // 2. Volume spike: 24h volume as a fraction of total (capped at 1)
  const volumeSpike = volume > 0 ? Math.min(volume24h / (volume * 0.1 + 1), 1) : 0;

  // 3. Price movement magnitude — use spread as proxy (thin = moved fast)
  const spreadWidth = Math.max(0, 1 - yesPrice - noPrice); // gap = opportunity

  // 4. Resolution window score: peaks 2-14 days out
  let resolutionScore = 0;
  if (days !== null) {
    if (days >= 1 && days <= 7) resolutionScore = 1;
    else if (days > 7 && days <= 14) resolutionScore = 0.8;
    else if (days > 14 && days <= 30) resolutionScore = 0.5;
    else if (days > 30) resolutionScore = 0.2;
  }

  // 5. Low liquidity = less efficient = more opportunity (inverse)
  const lowLiquidityBonus = liquidity < 5000 ? 0.8 : liquidity < 50000 ? 0.4 : 0.1;

  // 6. Volume spike from near-zero = breaking news signal
  const newsSignal = volume24h > 1000 && volumeSpike > 0.3 ? 0.8 : volumeSpike * 0.5;

  // Weighted composite score
  const raw =
    uncertainty * 25 +
    newsSignal * 20 +
    spreadWidth * 100 * 15 +
    resolutionScore * 20 +
    lowLiquidityBonus * 20;

  const score = Math.min(100, Math.max(0, Math.round(raw)));

  // Human-readable reasons
  const reasons: string[] = [];
  if (uncertainty > 0.7) reasons.push("Price near 50% — high uncertainty");
  if (newsSignal > 0.5) reasons.push("Volume spike detected — possible news catalyst");
  if (spreadWidth > 0.02) reasons.push(`Spread gap ${(spreadWidth * 100).toFixed(1)}% — liquidity imbalance`);
  if (resolutionScore >= 0.8 && days !== null) reasons.push(`Resolves in ~${Math.round(days)}d — sweet spot`);
  if (lowLiquidityBonus > 0.6) reasons.push("Low liquidity — less efficient pricing");
  if (yesPrice < 0.1) reasons.push("Extreme underdog — potential value if base rate is higher");
  if (yesPrice > 0.9) reasons.push("Heavy favorite — check for overconfidence bias");

  return {
    score,
    reasons: reasons.length ? reasons : ["No strong edge signals detected"],
    signals: {
      volumeSpike,
      priceMovement24h: volumeSpike > 0.3 ? volumeSpike : 0,
      daysToResolution: days ?? -1,
      spreadWidth,
      uncertaintyBonus: uncertainty,
      lowLiquidity: lowLiquidityBonus,
    },
  };
}

export function formatPrice(price: number): string {
  return `${(price * 100).toFixed(1)}¢`;
}

export function pnl(shares: number, entry: number, current: number, outcome: "YES" | "NO"): number {
  const entryPrice = outcome === "YES" ? entry : 1 - entry;
  const currentPrice = outcome === "YES" ? current : 1 - current;
  return shares * (currentPrice - entryPrice);
}
