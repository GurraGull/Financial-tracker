/**
 * Market Simulator
 *
 * Generates a realistic pool of synthetic Polymarket-like markets and
 * simulates price evolution between runs. This allows the auto-trader
 * algorithm to be tested and learned against in offline environments.
 *
 * Price dynamics:
 *   - Each market has a hidden "true probability" that drifts slowly
 *   - Market price = true prob + noise (bid-ask spread simulation)
 *   - Markets near resolution converge toward true outcome
 *   - Volume spikes are injected randomly to simulate news events
 *   - Markets resolve at end-of-life and pay out 0 or 1
 */

import type { PolymarketMarket, PolymarketToken } from "@/types";

// ─── Internal state (persisted between calls in module scope) ─────────────────

interface SimMarket {
  id: string;
  question: string;
  category: string;
  trueProb: number;        // hidden ground truth
  currentYes: number;      // observable market price
  volume: number;
  volume_24hr: number;
  liquidity: number;
  createdAt: number;       // ms timestamp
  endAt: number;           // ms timestamp (resolution time)
  resolved: boolean;
  resolvedYes: boolean;
}

const SIM_MARKETS: SimMarket[] = [];
let lastTickMs = 0;

// ─── Market templates ─────────────────────────────────────────────────────────

const TEMPLATES = [
  // Politics
  { q: "Will [Leader] win the [Country] election in [Year]?",          cat: "politics",  probRange: [0.10, 0.90] },
  { q: "Will [Party] control [Chamber] after [Month] [Year]?",          cat: "politics",  probRange: [0.25, 0.75] },
  { q: "Will [Country] hold a referendum on [Topic] by [Year]?",        cat: "politics",  probRange: [0.05, 0.40] },
  // Crypto
  { q: "Will Bitcoin exceed $[Price]K by end of [Month]?",              cat: "crypto",    probRange: [0.15, 0.85] },
  { q: "Will Ethereum ETF be approved by [Month] [Year]?",              cat: "crypto",    probRange: [0.20, 0.80] },
  { q: "Will [Token] reach $[Price] before [Date]?",                    cat: "crypto",    probRange: [0.05, 0.50] },
  // Sports
  { q: "Will [Team] win the [League] championship in [Year]?",          cat: "sports",    probRange: [0.05, 0.70] },
  { q: "Will [Player] score more than [N] goals this season?",           cat: "sports",    probRange: [0.30, 0.70] },
  // Economics
  { q: "Will US CPI exceed [N]% in [Month] [Year]?",                    cat: "economics", probRange: [0.15, 0.85] },
  { q: "Will Fed cut rates in [Month] [Year]?",                          cat: "economics", probRange: [0.20, 0.80] },
  { q: "Will US GDP growth exceed [N]% in Q[Q] [Year]?",               cat: "economics", probRange: [0.20, 0.80] },
  // Science / Tech
  { q: "Will [Company] release [Product] before [Date]?",               cat: "tech",      probRange: [0.15, 0.85] },
  { q: "Will [AI Model] pass [Benchmark] by [Year]?",                   cat: "tech",      probRange: [0.30, 0.70] },
];

const FILLERS: Record<string, string[]> = {
  Leader:   ["Trump","Biden","Macron","Scholz","Starmer","Meloni","Modi"],
  Country:  ["USA","France","Germany","UK","Brazil","India","Japan"],
  Year:     ["2025","2026","2027"],
  Month:    ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
  Party:    ["Democrats","Republicans","Labour","Conservatives","SPD","CDU"],
  Chamber:  ["Senate","House","Parliament"],
  Topic:    ["EU membership","independence","electoral reform"],
  Price:    ["80","90","100","120","150","200"],
  N:        ["3","5","10","15","20","3.0","2.5","4.0"],
  Token:    ["SOL","ETH","BNB","AVAX","LINK","DOT"],
  Date:     ["2025-06","2025-09","2025-12","2026-03","2026-06"],
  Team:     ["Lakers","Chiefs","Man City","Bayern","Barcelona","Yankees"],
  Player:   ["Mbappe","Haaland","LeBron","Messi","Ronaldo"],
  League:   ["NBA","NFL","Champions League","Premier League","La Liga"],
  Q:        ["1","2","3","4"],
  Company:  ["Apple","Google","Meta","OpenAI","Tesla","Nvidia"],
  Product:  ["Vision Pro 2","Gemini Ultra 3","GPT-5","FSD v13","Blackwell 2"],
  "AI Model": ["Claude 4","GPT-5","Gemini 2.5","LLaMA 4"],
  Benchmark:["MMLU 95%","HumanEval 99%","ARC-AGI","PhD Exam"],
};

function fill(template: string): string {
  return template.replace(/\[(\w+)\]/g, (_, key: string) => {
    const opts = FILLERS[key] ?? [key];
    return opts[Math.floor(Math.random() * opts.length)];
  });
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// ─── Initialise pool ──────────────────────────────────────────────────────────

export function ensureSimMarkets(count = 80): void {
  if (SIM_MARKETS.length >= count) return;

  const now = Date.now();
  while (SIM_MARKETS.length < count) {
    const tmpl  = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
    const [lo, hi] = tmpl.probRange;
    const trueProb  = rand(lo, hi);
    const noise     = rand(-0.06, 0.06);
    const currentYes = clamp(trueProb + noise, 0.02, 0.98);

    // Markets expire between 1 and 45 days from now
    const daysOut = rand(1, 45);
    const endAt   = now + daysOut * 86_400_000;

    SIM_MARKETS.push({
      id:          `sim-${SIM_MARKETS.length}-${Math.random().toString(36).slice(2, 8)}`,
      question:    fill(tmpl.q),
      category:    tmpl.cat,
      trueProb,
      currentYes,
      volume:      rand(5_000, 2_000_000),
      volume_24hr: rand(0, 50_000),
      liquidity:   rand(1_000, 200_000),
      createdAt:   now - rand(0, 30) * 86_400_000,
      endAt,
      resolved:    false,
      resolvedYes: false,
    });
  }

  lastTickMs = now;
}

// ─── Tick: evolve prices ───────────────────────────────────────────────────────

export function tickSimMarkets(): { resolved: SimMarket[] } {
  const now     = Date.now();
  const dtDays  = (now - lastTickMs) / 86_400_000;
  lastTickMs    = now;

  const resolved: SimMarket[] = [];

  for (const m of SIM_MARKETS) {
    if (m.resolved) continue;

    // Resolve markets that have passed their end time
    if (now >= m.endAt) {
      m.resolved    = true;
      m.resolvedYes = Math.random() < m.trueProb;
      m.currentYes  = m.resolvedYes ? 1.0 : 0.0;
      resolved.push(m);
      continue;
    }

    // True probability drifts (Wiener process)
    const sigma      = 0.015 * Math.sqrt(dtDays * 48); // ~half-hourly volatility
    m.trueProb       = clamp(m.trueProb + (Math.random() - 0.5) * 2 * sigma, 0.01, 0.99);

    // Convergence toward true prob as resolution approaches
    const daysLeft   = (m.endAt - now) / 86_400_000;
    const convergence = Math.max(0, 1 - daysLeft / 30); // 0 → 1 as expiry nears
    const target      = m.trueProb * (1 - convergence) + (m.trueProb > 0.5 ? 0.85 : 0.15) * convergence;

    // Market price = target + noise
    const noise       = rand(-0.04, 0.04) * (1 - convergence * 0.8);
    m.currentYes      = clamp(target + noise, 0.02, 0.98);

    // Random volume spikes (news events) ~5% chance per tick
    if (Math.random() < 0.05) {
      m.volume_24hr = rand(50_000, 500_000);
      // Spike moves price toward true prob faster
      m.currentYes = clamp(m.currentYes + (m.trueProb - m.currentYes) * 0.3, 0.02, 0.98);
    } else {
      // Normal volume decay
      m.volume_24hr = Math.max(0, m.volume_24hr * 0.9 + rand(0, 5_000));
    }

    m.volume += m.volume_24hr * dtDays;
    m.liquidity = clamp(m.liquidity + rand(-1_000, 1_000), 500, 300_000);
  }

  // Replace resolved markets with fresh ones to keep the pool full
  const resolvedIds = new Set(resolved.map((m) => m.id));
  const active = SIM_MARKETS.filter((m) => !resolvedIds.has(m.id) || !m.resolved);
  SIM_MARKETS.length = 0;
  SIM_MARKETS.push(...active);
  ensureSimMarkets(80);

  return { resolved };
}

// ─── Convert to PolymarketMarket shape ────────────────────────────────────────

function toPolymarket(m: SimMarket): PolymarketMarket {
  const yesToken: PolymarketToken = { token_id: `${m.id}-yes`, outcome: "YES", price: m.currentYes };
  const noToken:  PolymarketToken = { token_id: `${m.id}-no`,  outcome: "NO",  price: parseFloat((1 - m.currentYes).toFixed(4)) };

  return {
    id:            m.id,
    question:      m.question,
    description:   `Simulated market — category: ${m.category}`,
    end_date_iso:  new Date(m.endAt).toISOString(),
    active:        true,
    closed:        false,
    archived:      false,
    volume:        m.volume,
    volume_24hr:   m.volume_24hr,
    liquidity:     m.liquidity,
    tokens:        [yesToken, noToken],
    category:      m.category,
    tags:          [m.category],
    market_slug:   m.id,
  };
}

export function getSimMarkets(limit = 200): PolymarketMarket[] {
  ensureSimMarkets(80);
  return SIM_MARKETS
    .filter((m) => !m.resolved)
    .slice(0, limit)
    .map(toPolymarket);
}

export function getSimMarketById(id: string): PolymarketMarket | null {
  const m = SIM_MARKETS.find((s) => s.id === id);
  return m ? toPolymarket(m) : null;
}

export function isSimMarket(id: string): boolean {
  return id.startsWith("sim-");
}
