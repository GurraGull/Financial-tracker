import Anthropic from '@anthropic-ai/sdk';
import { COMPANIES } from '@/lib/companies';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface NewsItem { title: string; url: string; source: string; publishedAt: string; }
interface CompanyIntelligence { company: string; news: NewsItem[]; sentiment: 'bullish' | 'bearish' | 'neutral'; valuationSignal: string; keyEvents: string[]; summary: string; }

async function fetchNews(query: string): Promise<NewsItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; pm-terminal/1.0)' }, next: { revalidate: 3600 } });
  if (!res.ok) return [];
  const xml = await res.text();
  const items: NewsItem[] = [];
  const rx = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = rx.exec(xml)) !== null && items.length < 5) {
    const b = m[1];
    const title = (/<title><!\[CDATA\[(.*?)\]\]><\/title>/.exec(b) || /<title>(.*?)<\/title>/.exec(b))?.[1] ?? '';
    const link = /<link>(.*?)<\/link>/.exec(b)?.[1] ?? '';
    const pubDate = /<pubDate>(.*?)<\/pubDate>/.exec(b)?.[1] ?? '';
    const source = (/<source[^>]*>(.*?)<\/source>/.exec(b))?.[1] ?? 'Google News';
    if (title && link) items.push({ title: title.replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim(), url: link.trim(), source: source.replace(/&amp;/g, '&').trim(), publishedAt: pubDate.trim() });
  }
  return items;
}

async function analyse(name: string, news: NewsItem[]): Promise<{ sentiment: 'bullish' | 'bearish' | 'neutral'; valuationSignal: string; keyEvents: string[]; summary: string }> {
  if (!news.length) return { sentiment: 'neutral', valuationSignal: 'No recent news', keyEvents: [], summary: 'No recent news found.' };
  const list = news.map((n, i) => `${i + 1}. [${n.source}] ${n.title}`).join('\n');
  const stream = await client.messages.stream({
    model: 'claude-opus-4-7',
    max_tokens: 400,
    thinking: { type: 'adaptive' },
    messages: [{ role: 'user', content: `Private equity analyst tracking ${name}. News:\n${list}\n\nRespond ONLY valid JSON:\n{"sentiment":"bullish"|"bearish"|"neutral","valuationSignal":"one sentence","keyEvents":["max 3"],"summary":"two sentences"}` }],
  });
  const resp = await stream.finalMessage();
  const text = resp.content.filter((b) => b.type === 'text').map((b) => (b as { type: 'text'; text: string }).text).join('');
  try { return JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()); }
  catch { return { sentiment: 'neutral', valuationSignal: 'Analysis unavailable', keyEvents: [], summary: text.slice(0, 200) }; }
}

export async function GET(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 });

  const { searchParams } = new URL(request.url);
  const ids = (searchParams.get('companies') ?? '').split(',').filter(Boolean);
  const targets = ids.length
    ? COMPANIES.filter((c) => ids.includes(c.id))
    : COMPANIES.slice(0, 5);

  try {
    const results: CompanyIntelligence[] = await Promise.all(
      targets.map(async (co) => {
        const news = await fetchNews(`${co.name} valuation funding`);
        const analysis = await analyse(co.name, news);
        return { company: co.name, news, ...analysis };
      })
    );
    return Response.json({ companies: results, updatedAt: new Date().toISOString() });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
