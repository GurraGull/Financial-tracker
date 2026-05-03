'use client';

import { useEffect, useState } from 'react';
import { COMPANIES } from '@/lib/companies';

interface NewsItem { title: string; link: string; pubDate: string; source: string; }
interface CompanyNews { companyId: string; name: string; color: string; items: NewsItem[]; loading: boolean; error: boolean; }

interface Props { companyIds: string[]; }

export default function IntelligencePanel({ companyIds }: Props) {
  const [news, setNews] = useState<CompanyNews[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const targets = companyIds.length
    ? COMPANIES.filter((c) => companyIds.includes(c.id)).slice(0, 6)
    : COMPANIES.slice(0, 6);

  useEffect(() => {
    setNews(targets.map((c) => ({ companyId: c.id, name: c.name, color: c.color, items: [], loading: true, error: false })));

    targets.forEach(async (co) => {
      try {
        const q = encodeURIComponent(`${co.name} valuation funding investment`);
        const res = await fetch(
          `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(`https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`)}&count=5`
        );
        const json = await res.json();
        const items: NewsItem[] = (json.items ?? []).slice(0, 5).map((it: { title: string; link: string; pubDate: string; author?: string }) => ({
          title: it.title,
          link: it.link,
          pubDate: it.pubDate,
          source: it.author || 'Google News',
        }));
        setNews((prev) => prev.map((n) => n.companyId === co.id ? { ...n, items, loading: false } : n));
      } catch {
        setNews((prev) => prev.map((n) => n.companyId === co.id ? { ...n, loading: false, error: true } : n));
      }
    });
  }, [companyIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="pm-intel">
      <div className="pm-intel-header">
        <div>
          <div className="pm-intel-title">Portfolio Intelligence</div>
          <div className="pm-intel-sub">Live news feed for your tracked companies</div>
        </div>
      </div>

      <div className="pm-intel-grid">
        {news.map((co) => (
          <div key={co.companyId} className="pm-intel-card" style={{ borderTopColor: co.color }}>
            <div className="pm-intel-body">
              <div className="pm-intel-head">
                <div className="pm-intel-name">{co.name}</div>
                <div className="pm-intel-badge" style={{ background: `${co.color}18`, color: co.color }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: co.color, display: 'inline-block' }} />
                  Live
                </div>
              </div>

              {co.loading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[80, 65, 75].map((w, i) => (
                    <div key={i} className="pm-skeleton" style={{ height: 10, width: `${w}%`, borderRadius: 4 }} />
                  ))}
                </div>
              )}

              {co.error && <div className="pm-intel-summary" style={{ color: 'var(--txt3)' }}>Could not load news.</div>}

              {!co.loading && !co.error && co.items.length === 0 && (
                <div className="pm-intel-summary" style={{ color: 'var(--txt3)' }}>No recent news found.</div>
              )}

              {!co.loading && co.items.length > 0 && (
                <>
                  <div className="pm-intel-summary">{co.items[0].title}</div>
                  <button
                    className="pm-intel-news-btn"
                    style={{ padding: '6px 0', marginTop: 4 }}
                    onClick={() => setExpanded(expanded === co.companyId ? null : co.companyId)}
                  >
                    <span>{co.items.length} articles</span>
                    <span>{expanded === co.companyId ? '▲' : '▼'}</span>
                  </button>
                </>
              )}
            </div>

            {expanded === co.companyId && co.items.length > 0 && (
              <div className="pm-intel-news-list">
                {co.items.map((item, i) => (
                  <div key={i} className="pm-intel-news-item">
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="pm-intel-news-link">{item.title}</a>
                    <div className="pm-intel-news-src">{new Date(item.pubDate).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
