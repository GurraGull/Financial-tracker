'use client';

import { useState } from 'react';
import Link from 'next/link';
import { COMPANIES } from '@/lib/companies';

const TOTAL_MARKET_CAP = COMPANIES.reduce((s, c) => s + c.currentValuationM, 0);

function fmtVal(m: number) {
  if (m >= 1_000_000) return `$${(m / 1_000_000).toFixed(1)}T`;
  if (m >= 1_000) return `$${(m / 1_000).toFixed(0)}B`;
  return `$${m}M`;
}

function blendedPrice(forge: number | null, hiive: number | null, notice: number | null): number | null {
  const vals = [forge, hiive, notice].filter((v): v is number => v !== null);
  if (!vals.length) return null;
  return vals.sort((a, b) => a - b)[Math.floor(vals.length / 2)];
}

function Logo({ domain, name, color, size = 32 }: { domain: string; name: string; color: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const r = Math.round(size * 0.26);
  return (
    <div style={{
      width: size, height: size, borderRadius: r, flexShrink: 0,
      background: failed ? color + '22' : 'rgba(255,255,255,0.06)',
      border: `1px solid ${failed ? color + '44' : 'rgba(255,255,255,0.08)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.44), fontWeight: 800, color: failed ? color : 'var(--txt2)', overflow: 'hidden',
    }}>
      {!failed
        ? <img src={`https://logo.clearbit.com/${domain}`} alt="" width={Math.round(size * 0.6)} height={Math.round(size * 0.6)} style={{ objectFit: 'contain' }} onError={() => setFailed(true)} />
        : name[0]}
    </div>
  );
}

const SECTORS = ['All', 'AI', 'Fintech', 'Aerospace', 'Defense', 'Gaming', 'Other'];
const SECTOR_MAP: Record<string, string[]> = {
  AI: ['AI Safety', 'AI Foundation', 'AI Search', 'AI Infrastructure', 'Data & AI'],
  Fintech: ['Fintech', 'HR & Payroll'],
  Aerospace: ['Aerospace'],
  Defense: ['Defense Tech'],
  Gaming: ['Gaming'],
  Other: ['Autonomous Vehicles', 'B2B Commerce', 'E-Commerce', 'Social / Gaming', 'Social / AI', 'Design Tools', 'Productivity'],
};
type SortKey = 'valuation' | 'price';

export default function LandingPage() {
  const [sector, setSector] = useState('All');
  const [sortKey, setSortKey] = useState<SortKey>('valuation');
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  const filtered = COMPANIES.filter((co) => {
    if (sector === 'All') return true;
    return (SECTOR_MAP[sector] ?? []).includes(co.sector);
  });
  const sorted = [...filtered].sort((a, b) => {
    const va = sortKey === 'valuation' ? a.currentValuationM : (blendedPrice(a.forgePrice, a.hiivePrice, a.noticePrice) ?? 0);
    const vb = sortKey === 'valuation' ? b.currentValuationM : (blendedPrice(b.forgePrice, b.hiivePrice, b.noticePrice) ?? 0);
    return (vb - va) * sortDir;
  });

  const toggle = (k: SortKey) => {
    if (k === sortKey) setSortDir(d => d === -1 ? 1 : -1);
    else { setSortKey(k); setSortDir(-1); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--txt)', fontFamily: 'var(--font)' }}>
      <div className="pm-bg" />

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav className="land-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="pm-logo" style={{ width: 32, height: 32, fontSize: 11, flexShrink: 0 }}>PM</div>
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em' }}>PM Terminal</span>
          <span className="land-nav-tag">Private Markets</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--txt3)', marginRight: 4 }}>{COMPANIES.length} companies tracked</span>
          <Link href="/app" style={{ textDecoration: 'none' }}><button className="pm-btn">Sign in</button></Link>
          <Link href="/app" style={{ textDecoration: 'none' }}><button className="pm-btn pri">Open Terminal →</button></Link>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="land-hero">
        <div className="land-hero-inner">
          <div className="land-badge">
            <span className="land-badge-dot" />
            Real-time secondary market pricing
          </div>

          <h1 className="land-h1">
            Track what Wall Street<br />
            <span className="land-h1-accent">hasn't priced yet</span>
          </h1>

          <p className="land-sub">
            PM Terminal pulls live valuations and secondary prices from Forge, Hiive, and Notice
            — the three largest private markets — so you always know what your pre-IPO positions are worth.
          </p>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 56 }}>
            <Link href="/app" style={{ textDecoration: 'none' }}>
              <button className="pm-btn pri land-cta-btn">Open Portfolio Terminal →</button>
            </Link>
            <a href="#universe" style={{ textDecoration: 'none' }}>
              <button className="pm-btn land-cta-btn">Explore universe ↓</button>
            </a>
          </div>

          {/* Stat row */}
          <div className="land-stats">
            {[
              { label: 'Total market cap tracked', value: fmtVal(TOTAL_MARKET_CAP) },
              { label: 'Companies in universe', value: `${COMPANIES.length}` },
              { label: 'Price sources', value: '3' },
              { label: 'Update frequency', value: 'Real-time' },
            ].map((s) => (
              <div key={s.label} className="land-stat">
                <div className="land-stat-val">{s.value}</div>
                <div className="land-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── UNIVERSE TABLE ──────────────────────────────────── */}
      <section id="universe" style={{ position: 'relative', zIndex: 1, maxWidth: 1080, margin: '0 auto', padding: '0 24px 80px' }}>
        <div className="land-section-header">
          <div>
            <div className="land-section-title">Private Market Universe</div>
            <div className="land-section-sub">Secondary price = median of Forge · Hiive · Notice</div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SECTORS.map((s) => (
              <button
                key={s}
                onClick={() => setSector(s)}
                className={`land-filter-btn ${sector === s ? 'on' : ''}`}
              >{s}</button>
            ))}
          </div>
        </div>

        <div className="land-table">
          {/* Header */}
          <div className="land-trow land-thead">
            <div>Company</div>
            <div style={{ textAlign: 'right' }}>Stage</div>
            <div
              onClick={() => toggle('valuation')}
              style={{ textAlign: 'right', cursor: 'pointer', color: sortKey === 'valuation' ? 'var(--indigo)' : undefined }}
            >Valuation {sortKey === 'valuation' ? (sortDir === -1 ? '↓' : '↑') : ''}</div>
            <div
              onClick={() => toggle('price')}
              style={{ textAlign: 'right', cursor: 'pointer', color: sortKey === 'price' ? 'var(--indigo)' : undefined }}
            >Secondary Price {sortKey === 'price' ? (sortDir === -1 ? '↓' : '↑') : ''}</div>
          </div>

          {sorted.map((co) => {
            const blended = blendedPrice(co.forgePrice, co.hiivePrice, co.noticePrice);
            return (
              <div key={co.id} className="land-trow land-tbody-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <Logo domain={co.domain} name={co.name} color={co.color} size={34} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{co.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 1, fontFamily: 'var(--mono)' }}>{co.ticker} · {co.sector}</div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className="land-pill">{co.stage}</span>
                </div>

                <div style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>
                  {fmtVal(co.currentValuationM)}
                </div>

                <div style={{ textAlign: 'right' }}>
                  {blended !== null ? (
                    <>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: co.color }}>
                        ${blended.toFixed(2)}
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--txt3)', marginTop: 2 }}>per share</div>
                    </>
                  ) : (
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--txt3)' }}>—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: 14, fontSize: 10, color: 'var(--txt3)' }}>
          Prices are estimates based on public secondary market activity · Not financial advice
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, maxWidth: 1080, margin: '0 auto', padding: '0 24px 80px' }}>
        <div className="land-features">
          {[
            { icon: '◈', title: 'Your positions, your numbers', body: 'Add shares, entry price, and valuation. PM Terminal calculates cost basis, current value, P&L, IRR, and carry fees — automatically updated as valuations change.' },
            { icon: '◉', title: 'Blended secondary pricing', body: 'No single source is definitive. We take the median of Forge, Hiive, and Notice — the three largest private secondary markets — for the most honest price estimate.' },
            { icon: '◎', title: 'Instant push updates', body: 'Supabase Realtime keeps every open browser in sync. When a company updates, your P&L moves immediately. No manual refresh, no stale numbers.' },
            { icon: '✎', title: 'Portfolio intelligence', body: 'A live news feed filters headlines to the companies you hold. Every article, sourced directly from Google News — no paywalls, no summaries you didn\'t ask for.' },
          ].map((f) => (
            <div key={f.title} className="land-feature">
              <div className="land-feature-icon">{f.icon}</div>
              <div className="land-feature-title">{f.title}</div>
              <div className="land-feature-body">{f.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, maxWidth: 1080, margin: '0 auto', padding: '0 24px 100px' }}>
        <div className="land-cta-box">
          <div className="land-cta-title">Ready to see what your portfolio is worth?</div>
          <div className="land-cta-sub">
            Sign up free. Add your positions in minutes. Watch your P&L update in real-time.
          </div>
          <Link href="/app" style={{ textDecoration: 'none' }}>
            <button className="pm-btn pri land-cta-btn">Create Free Account →</button>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="land-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="pm-logo" style={{ width: 24, height: 24, fontSize: 8 }}>PM</div>
          <span style={{ fontSize: 11, color: 'var(--txt3)' }}>PM Terminal</span>
        </div>
        <div style={{ fontSize: 10, color: 'var(--txt3)' }}>
          Valuations and prices are estimates · Not financial advice
        </div>
      </footer>
    </div>
  );
}
