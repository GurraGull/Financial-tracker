import { NextResponse } from 'next/server';
import { COMPANIES } from '@/lib/companies';

export const revalidate = 900; // 15 min cache

interface NewsItem { title: string; url: string; source: string; publishedAt: string; }

function decode(s: string) {
  return s
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}

async function fetchNews(query: string, limit = 6): Promise<NewsItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; pm-terminal/1.0)' },
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items: NewsItem[] = [];
    const rx = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = rx.exec(xml)) !== null && items.length < limit) {
      const b = m[1];
      const title = (/<title><!\[CDATA\[(.*?)\]\]><\/title>/.exec(b) || /<title>(.*?)<\/title>/.exec(b))?.[1] ?? '';
      const link = /<link>(.*?)<\/link>/.exec(b)?.[1] ?? '';
      const pubDate = /<pubDate>(.*?)<\/pubDate>/.exec(b)?.[1] ?? '';
      const source = (/<source[^>]*>(.*?)<\/source>/.exec(b))?.[1] ?? 'Google News';
      if (title && link) items.push({ title: decode(title), url: link.trim(), source: decode(source), publishedAt: pubDate.trim() });
    }
    return items;
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = (searchParams.get('companies') ?? '').split(',').filter(Boolean);
  const targets = ids.length
    ? COMPANIES.filter((c) => ids.includes(c.id))
    : COMPANIES.slice(0, 6);

  const results = await Promise.all(
    targets.map(async (co) => ({
      companyId: co.id,
      name: co.name,
      color: co.color,
      items: await fetchNews(`"${co.name}" valuation OR funding OR IPO`),
    }))
  );

  return NextResponse.json({ companies: results, updatedAt: new Date().toISOString() });
}
