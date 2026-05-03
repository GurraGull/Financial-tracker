import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ── Slug maps ─────────────────────────────────────────────────────────────────
// Forge:  https://forgeglobal.com/{slug}_stock/
// Notice: https://notice.co/c/{slug}
// Hiive:  https://hiive.com/markets/{slug}  (verify slugs when live)

const FORGE_SLUGS: Record<string, string> = {
  'openai':     'openai',
  'anthropic':  'anthropic',
  'stripe':     'stripe',
  'spacex':     'spacex',
  'databricks': 'databricks',
  'revolut':    'revolut',
  'waymo':      'waymo',
  'epic-games': 'epic_games',
  'anduril':    'anduril',
  'canva':      'canva',
  'discord':    'discord',
  'perplexity': 'perplexity',
  'mistral':    'mistral_ai',
};

const NOTICE_SLUGS: Record<string, string> = {
  'openai':     'openai',
  'anthropic':  'anthropic',
  'stripe':     'stripe',
  'spacex':     'spacex',
  'databricks': 'databricks',
  'revolut':    'revolut',
  'waymo':      'waymo',
  'epic-games': 'epic-games',
  'anduril':    'anduril',
  'canva':      'canva',
  'discord':    'discord',
  'perplexity': 'perplexity',
  'mistral':    'mistral',
};

// Hiive: https://www.hiive.com/securities/{slug}-stock
const HIIVE_SLUGS: Record<string, string> = {
  'openai':     'openai',
  'anthropic':  'anthropic',
  'stripe':     'stripe',
  'spacex':     'spacex',
  'databricks': 'databricks',
  'revolut':    'revolut',
  'waymo':      'waymo',
  'epic-games': 'epic-games',
  'anduril':    'anduril',
  'canva':      'canva',
  'discord':    'discord',
  'perplexity': 'perplexity',
  'mistral':    'mistral-ai',
};

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
};

// ── Price extraction ──────────────────────────────────────────────────────────

function isSharePrice(n: number) { return n > 0.5 && n < 100_000; }

function findPriceInJson(obj: unknown, depth = 0): number | null {
  if (depth > 8 || obj === null || typeof obj !== 'object') return null;
  const KEYS = ['lastPrice', 'last_price', 'sharePrice', 'share_price', 'askPrice', 'ask_price',
    'bidPrice', 'bid_price', 'indicativePrice', 'indicative_price', 'price', 'currentPrice',
    'current_price', 'latestPrice', 'latest_price', 'tradePrice', 'trade_price', 'midpoint'];
  for (const key of KEYS) {
    const val = (obj as Record<string, unknown>)[key];
    if (typeof val === 'number' && isSharePrice(val)) return val;
    if (typeof val === 'string') {
      const n = parseFloat(val.replace(/[^0-9.]/g, ''));
      if (!isNaN(n) && isSharePrice(n)) return n;
    }
  }
  for (const v of Object.values(obj as Record<string, unknown>)) {
    const found = findPriceInJson(v, depth + 1);
    if (found !== null) return found;
  }
  return null;
}

function extractFromHtml(html: string): number | null {
  // __NEXT_DATA__ (Next.js SSR — covers Forge and Notice)
  const nextData = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (nextData) {
    try {
      const price = findPriceInJson(JSON.parse(nextData[1]));
      if (price !== null) return price;
    } catch { /* continue */ }
  }

  // window globals (Nuxt, CRA, etc.)
  for (const m of html.matchAll(/window\.__[A-Z_]+__\s*=\s*(\{[\s\S]*?\});/g)) {
    try {
      const price = findPriceInJson(JSON.parse(m[1]));
      if (price !== null) return price;
    } catch { /* continue */ }
  }

  // Regex fallbacks on raw HTML
  const patterns = [
    /\$\s*(\d{1,5}(?:\.\d{1,2})?)\s*\/\s*share/i,
    /"(?:last|share|ask|bid|indicative|current|trade)(?:P|_p)rice"\s*:\s*"?(\d+(?:\.\d+)?)"?/i,
    /class="[^"]*price[^"]*"[^>]*>\s*\$\s*(\d{2,5}(?:\.\d{1,2})?)/i,
  ];
  for (const pat of patterns) {
    const m = html.match(pat);
    if (m) {
      const val = parseFloat(m[1]);
      if (isSharePrice(val)) return val;
    }
  }
  return null;
}

async function fetchPrice(url: string): Promise<number | null> {
  try {
    const res = await fetch(url, { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    return extractFromHtml(await res.text());
  } catch { return null; }
}

// ── Scrape all three sources for one company ──────────────────────────────────

type SourceResult = { forge: number | null; hiive: number | null; notice: number | null };

async function scrapeCompany(companyId: string): Promise<SourceResult> {
  const [forge, notice, hiive] = await Promise.all([
    FORGE_SLUGS[companyId]
      ? fetchPrice(`https://forgeglobal.com/${FORGE_SLUGS[companyId]}_stock/`)
      : Promise.resolve(null),
    NOTICE_SLUGS[companyId]
      ? fetchPrice(`https://notice.co/c/${NOTICE_SLUGS[companyId]}`)
      : Promise.resolve(null),
    HIIVE_SLUGS[companyId]
      ? fetchPrice(`https://www.hiive.com/securities/${HIIVE_SLUGS[companyId]}-stock`)
      : Promise.resolve(null),
  ]);
  return { forge, hiive, notice };
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const sb = createClient(url, key, { global: { headers: { authorization: authHeader } } });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const ids: string[] = body.companyIds ?? Object.keys(FORGE_SLUGS);

  const results: Record<string, SourceResult> = {};
  const saved: string[] = [];

  // Scrape 3 at a time
  for (let i = 0; i < ids.length; i += 3) {
    const chunk = ids.slice(i, i + 3);
    await Promise.all(chunk.map(async (id) => {
      results[id] = await scrapeCompany(id);
    }));
    if (i + 3 < ids.length) await new Promise((r) => setTimeout(r, 600));
  }

  // Persist to secondary_prices
  for (const [companyId, prices] of Object.entries(results)) {
    for (const [source, price] of Object.entries(prices) as [string, number | null][]) {
      if (price === null) continue;
      const { error } = await sb.from('secondary_prices').insert({
        company_id: companyId,
        source,
        price,
        notes: `auto-scraped from ${source}`,
      });
      if (!error) saved.push(`${companyId}:${source}`);
    }
  }

  return NextResponse.json({ results, saved, total: saved.length });
}
