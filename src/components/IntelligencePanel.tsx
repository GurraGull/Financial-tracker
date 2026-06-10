'use client';

import { useEffect, useState, useCallback } from 'react';

interface NewsItem { title: string; url: string; source: string; publishedAt: string; }
interface CompanyNews { companyId: string; name: string; color: string; items: NewsItem[]; }

interface Props { companyIds: string[]; }

const REFRESH_MS = 15 * 60_000;

function timeAgo(d: string) {
  const ms = Date.now() - new Date(d).getTime();
  if (isNaN(ms)) return '';
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return `${Math.max(1, Math.floor(ms / 60_000))}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function IntelligencePanel({ companyIds }: Props) {
  const [news, setNews] = useState<CompanyNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const key = companyIds.join(',');

  const load = useCallback(async () => {
    try {
      setError(false);
      const res = await fetch(`/api/news${key ? `?companies=${key}` : ''}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setNews(json.companies ?? []);
      setUpdatedAt(json.updatedAt ?? null);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    setLoading(true);
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="pm-intel">
      <div className="pm-intel-header">
        <div>
          <div className="pm-intel-title">Portfolio Intelligence</div>
          <div className="pm-intel-sub">
            Live news feed for your tracked companies
            {updatedAt && ` · updated ${new Date(updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
          </div>
        </div>
        <button className="pm-btn" onClick={() => { setLoading(true); load(); }} disabled={loading}>
          {loading ? 'Refreshing…' : '⟳ Refresh'}
        </button>
      </div>

      {error && (
        <div className="pm-intel-summary" style={{ color: 'var(--txt3)', padding: 20 }}>
          Could not load news. Try refreshing.
        </div>
      )}

      <div className="pm-intel-grid">
        {loading && news.length === 0 && [0, 1, 2].map((i) => (
          <div key={i} className="pm-intel-card">
            <div className="pm-intel-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[60, 80, 65, 75].map((w, j) => (
                  <div key={j} className="pm-skeleton" style={{ height: 10, width: `${w}%`, borderRadius: 4 }} />
                ))}
              </div>
            </div>
          </div>
        ))}

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

              {co.items.length === 0 && (
                <div className="pm-intel-summary" style={{ color: 'var(--txt3)' }}>No recent news found.</div>
              )}

              {co.items.length > 0 && (
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
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="pm-intel-news-link">{item.title}</a>
                    <div className="pm-intel-news-src">{item.source}{item.publishedAt && ` · ${timeAgo(item.publishedAt)}`}</div>
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
