'use client';

import { useEffect, useState } from 'react';

interface NewsItem { title: string; url: string; source: string; publishedAt: string; }
interface CompanyIntelligence { company: string; news: NewsItem[]; sentiment: 'bullish' | 'bearish' | 'neutral'; valuationSignal: string; keyEvents: string[]; summary: string; }
interface IntelligenceData { companies: CompanyIntelligence[]; updatedAt: string; }

const SC = {
  bullish: { label: 'Bullish', bg: 'rgba(16,185,129,0.12)', text: '#10B981', dot: '#10B981' },
  bearish: { label: 'Bearish', bg: 'rgba(239,68,68,0.1)', text: '#EF4444', dot: '#EF4444' },
  neutral: { label: 'Neutral', bg: 'rgba(255,255,255,0.06)', text: 'rgba(255,255,255,0.48)', dot: 'rgba(255,255,255,0.3)' },
};

interface Props { companyIds: string[]; }

export default function IntelligencePanel({ companyIds }: Props) {
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetch_ = async () => {
    setLoading(true); setError(null);
    try {
      const ids = companyIds.slice(0, 5).join(',');
      const res = await fetch(`/api/intelligence?companies=${encodeURIComponent(ids)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setData(json);
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (companyIds.length) fetch_(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="pm-intel">
      <div className="pm-intel-header">
        <div>
          <div className="pm-intel-title">Portfolio Intelligence</div>
          <div className="pm-intel-sub">AI-powered news analysis · {data ? `Updated ${new Date(data.updatedAt).toLocaleTimeString()}` : 'Not loaded'}</div>
        </div>
        <button className="pm-btn" onClick={fetch_} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {loading ? <><span style={{ display: 'inline-block', width: 10, height: 10, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Analyzing…</> : <>↻ Refresh</>}
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', color: '#EF4444', fontSize: 12, marginBottom: 14 }}>
          {error === 'ANTHROPIC_API_KEY not configured'
            ? <>Add <code style={{ background: 'rgba(239,68,68,0.15)', padding: '1px 5px', borderRadius: 4 }}>ANTHROPIC_API_KEY</code> in Vercel → Settings → Environment Variables, then redeploy.</>
            : error}
        </div>
      )}

      {loading && !data && (
        <div className="pm-intel-grid">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="pm-skeleton" style={{ height: 160 }} />)}
        </div>
      )}

      {data && (
        <div className="pm-intel-grid">
          {data.companies.map((co) => {
            const sc = SC[co.sentiment];
            const isOpen = expanded === co.company;
            return (
              <div key={co.company} className="pm-intel-card" style={{ borderTopColor: sc.dot }}>
                <div className="pm-intel-body">
                  <div className="pm-intel-head">
                    <div className="pm-intel-name">{co.company}</div>
                    <div className="pm-intel-badge" style={{ background: sc.bg, color: sc.text }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc.dot, display: 'inline-block' }} />
                      {sc.label}
                    </div>
                  </div>
                  <div className="pm-intel-summary">{co.summary}</div>
                  {co.keyEvents.length > 0 && (
                    <ul className="pm-intel-events">
                      {co.keyEvents.map((ev, i) => (
                        <li key={i} className="pm-intel-ev">
                          <span style={{ color: sc.dot, flexShrink: 0 }}>▸</span>{ev}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="pm-intel-signal">{co.valuationSignal}</div>
                </div>
                {co.news.length > 0 && (
                  <>
                    <button className="pm-intel-news-btn" onClick={() => setExpanded(isOpen ? null : co.company)}>
                      <span>{co.news.length} recent articles</span><span>{isOpen ? '▲' : '▼'}</span>
                    </button>
                    {isOpen && (
                      <div className="pm-intel-news-list">
                        {co.news.map((item, i) => (
                          <div key={i} className="pm-intel-news-item">
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="pm-intel-news-link">{item.title}</a>
                            <div className="pm-intel-news-src">{item.source}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
