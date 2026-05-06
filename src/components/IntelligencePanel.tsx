'use client';

import { useEffect, useState } from 'react';
import { Company } from '@/lib/companies';
import { fetchNewsItems, NewsItemRecord } from '@/lib/news-db';

interface CompanyNews { companyId: string; name: string; color: string; items: NewsItemRecord[]; loading: boolean; error: boolean; }

interface Props {
  companyIds: string[];
  companies: Company[];
}

export default function IntelligencePanel({ companyIds, companies }: Props) {
  const [news, setNews] = useState<CompanyNews[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const targets = companyIds.length
    ? companies.filter((c) => companyIds.includes(c.id)).slice(0, 6)
    : companies.slice(0, 6);

  useEffect(() => {
    if (targets.length === 0) return;

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setNews(targets.map((c) => ({ companyId: c.id, name: c.name, color: c.color, items: [], loading: true, error: false })));
      }
    });

    const loadNews = async () => {
      const { items, error } = await fetchNewsItems({
        companyIds: targets.map((target) => target.id),
        limit: 50,
        publishedOnly: true,
      });
      if (cancelled) return;

      const byCompany = new Map<string, NewsItemRecord[]>();
      for (const item of items) {
        const current = byCompany.get(item.companyId) ?? [];
        if (current.length < 5) {
          current.push(item);
          byCompany.set(item.companyId, current);
        }
      }

      setNews(targets.map((target) => ({
        companyId: target.id,
        name: target.name,
        color: target.color,
        items: byCompany.get(target.id) ?? [],
        loading: false,
        error: !!error,
      })));
    };

    loadNews();
    return () => {
      cancelled = true;
    };
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
        {targets.length === 0 && (
          <div className="pm-empty" style={{ gridColumn: '1 / -1' }}>
            <div className="pm-empty-icon">◉</div>
            <div className="pm-empty-title">No tracked companies yet</div>
            <div className="pm-empty-sub">Import your company list into Supabase or add a company in admin before using the news feed.</div>
          </div>
        )}
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
                    <a href={item.link || '#'} target="_blank" rel="noopener noreferrer" className="pm-intel-news-link">{item.title}</a>
                    <div className="pm-intel-news-src">{item.source} · {new Date(item.publishedAt).toLocaleDateString()}</div>
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
