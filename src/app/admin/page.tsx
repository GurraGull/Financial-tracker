'use client';

import { useState } from 'react';
import Link from 'next/link';
import { COMPANIES } from '@/lib/companies';

interface ScrapeResult { forge: number | null; hiive: number | null; notice: number | null; }

export default function AdminPage() {
  const [syncing, setSyncing] = useState(false);
  const [results, setResults] = useState<Record<string, ScrapeResult>>({});
  const [done, setDone] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    setDone(false);
    try {
      const res = await fetch('/api/scrape-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyIds: COMPANIES.map((c) => c.id) }),
      });
      const json = await res.json();
      setResults(json.results ?? {});
      setDone(true);
    } catch {
      setDone(true);
    } finally {
      setSyncing(false);
    }
  };

  const found = Object.values(results).filter(
    (r) => r.forge !== null || r.hiive !== null || r.notice !== null
  ).length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--txt)', fontFamily: 'var(--font)', padding: 32 }}>
      <div className="pm-bg" />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 }}>Price Scraper</div>
            <div style={{ fontSize: 12, color: 'var(--txt3)' }}>Fetch secondary prices from Forge · Hiive · Notice</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/app" style={{ textDecoration: 'none' }}><button className="pm-btn">← Portfolio</button></Link>
            <button className="pm-btn pri" onClick={handleSync} disabled={syncing}>
              {syncing ? 'Scraping…' : '⟳ Sync All Prices'}
            </button>
          </div>
        </div>

        {done && (
          <div style={{ marginBottom: 20, padding: '10px 16px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, fontSize: 12, color: 'var(--green)' }}>
            Done — found prices for {found} of {COMPANIES.length} companies.
            {found === 0 && ' Sites may be blocking scraping — copy prices manually into src/lib/companies.ts'}
          </div>
        )}

        <div style={{ background: 'var(--card)', border: '1px solid var(--brd)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '10px 20px', borderBottom: '1px solid var(--div)', background: 'rgba(255,255,255,0.02)' }}>
            {['Company', 'Forge', 'Hiive', 'Notice'].map((h) => (
              <div key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--txt3)' }}>{h}</div>
            ))}
          </div>
          {COMPANIES.map((co, idx) => {
            const r = results[co.id];
            const Price = ({ v }: { v: number | null | undefined }) =>
              v != null
                ? <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: co.color }}>${v.toFixed(2)}</span>
                : <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--txt3)' }}>—</span>;
            return (
              <div key={co.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '13px 20px', alignItems: 'center', borderBottom: idx === COMPANIES.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: co.color + '22', border: `1px solid ${co.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: co.color }}>{co.name[0]}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{co.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--txt3)', fontFamily: 'var(--mono)' }}>{co.ticker}</div>
                  </div>
                </div>
                <Price v={r?.forge} />
                <Price v={r?.hiive} />
                <Price v={r?.notice} />
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 20, padding: 18, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--div)', borderRadius: 12, fontSize: 11, color: 'var(--txt3)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--txt2)' }}>To save prices permanently:</strong> copy values above into{' '}
          <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 4 }}>src/lib/companies.ts</code> —
          set <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 4 }}>forgePrice</code>,{' '}
          <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 4 }}>hiivePrice</code>, or{' '}
          <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 4 }}>noticePrice</code>.
          They flow into the blended secondary price automatically.
        </div>
      </div>
    </div>
  );
}
