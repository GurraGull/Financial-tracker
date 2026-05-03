'use client';

import { useState } from 'react';
import Link from 'next/link';
import { COMPANIES } from '@/lib/companies';

function fmtVal(m: number) {
  if (m >= 1_000_000) return `$${(m / 1_000_000).toFixed(1)}T`;
  if (m >= 1_000) return `$${(m / 1_000).toFixed(0)}B`;
  return `$${m}M`;
}

function fmtArr(m: number | null) {
  if (m === null) return 'N/A';
  if (m >= 1_000) return `$${(m / 1_000).toFixed(1)}B`;
  return `$${m}M`;
}

function blendedPrice(forge: number | null, hiive: number | null, notice: number | null): number | null {
  const vals = [forge, hiive, notice].filter((v): v is number => v !== null);
  if (!vals.length) return null;
  return vals.sort((a, b) => a - b)[Math.floor(vals.length / 2)];
}

function Logo({ domain, name, color, size = 28 }: { domain: string; name: string; color: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.28), flexShrink: 0,
      background: failed ? color : 'rgba(255,255,255,0.07)',
      border: failed ? 'none' : '1px solid rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.42), fontWeight: 800, color: 'white', overflow: 'hidden',
    }}>
      {!failed ? (
        <img src={`https://logo.clearbit.com/${domain}`} alt="" width={Math.round(size * 0.62)} height={Math.round(size * 0.62)} style={{ objectFit: 'contain' }} onError={() => setFailed(true)} />
      ) : name[0]}
    </div>
  );
}

const SECTORS = ['All', 'AI', 'Fintech', 'Design Tools', 'Aerospace', 'Defense Tech', 'Gaming', 'Social', 'Other'];
const SECTOR_MAP: Record<string, string[]> = {
  'AI': ['AI Safety', 'AI Foundation', 'AI Search', 'AI Infrastructure', 'Data & AI'],
  'Fintech': ['Fintech', 'HR & Payroll'],
  'Design Tools': ['Design Tools', 'Productivity'],
  'Aerospace': ['Aerospace'],
  'Defense Tech': ['Defense Tech'],
  'Gaming': ['Gaming'],
  'Social': ['Social / Gaming', 'Social / AI'],
  'Other': ['Autonomous Vehicles', 'B2B Commerce', 'E-Commerce'],
};

type SortKey = 'valuation' | 'arr' | 'price';

export default function LandingPage() {
  const [sector, setSector] = useState('All');
  const [sortKey, setSortKey] = useState<SortKey>('valuation');
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  const handleSort = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === -1 ? 1 : -1));
    else { setSortKey(k); setSortDir(-1); }
  };

  const filtered = COMPANIES.filter((co) => {
    if (sector === 'All') return true;
    const allowed = SECTOR_MAP[sector] ?? [];
    return allowed.includes(co.sector);
  });

  const sorted = [...filtered].sort((a, b) => {
    const va = sortKey === 'valuation' ? a.currentValuationM : sortKey === 'arr' ? (a.arrM ?? 0) : (blendedPrice(a.forgePrice, a.hiivePrice, a.noticePrice) ?? 0);
    const vb = sortKey === 'valuation' ? b.currentValuationM : sortKey === 'arr' ? (b.arrM ?? 0) : (blendedPrice(b.forgePrice, b.hiivePrice, b.noticePrice) ?? 0);
    return (vb - va) * sortDir;
  });

  const sortIcon = (k: SortKey) => sortKey === k ? (sortDir === -1 ? ' ↓' : ' ↑') : '';

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: 'var(--txt)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="pm-bg" />

      {/* NAV */}
      <nav style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: 60, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="pm-logo" style={{ width: 34, height: 34, fontSize: 12, flexShrink: 0 }}>PM</div>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt)', letterSpacing: '-0.01em' }}>PM Terminal</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/app" style={{ textDecoration: 'none' }}><button className="pm-btn">Sign In</button></Link>
          <Link href="/app" style={{ textDecoration: 'none' }}><button className="pm-btn pri">Get Started</button></Link>
        </div>
      </nav>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>

        {/* HERO */}
        <section style={{ padding: '72px 0 56px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 13px', background: 'rgba(99,91,255,0.1)', border: '1px solid rgba(99,91,255,0.25)', borderRadius: 20, marginBottom: 26 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#635BFF', display: 'inline-block' }} />
            <span style={{ fontSize: 10, color: '#635BFF', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Private Markets Intelligence</span>
          </div>
          <h1 style={{ fontSize: 'clamp(30px, 5vw, 54px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 18px', color: '#f0f0f8' }}>
            Track the companies<br />
            <span style={{ background: 'linear-gradient(135deg, #635BFF 0%, #FF6B35 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>before they go public</span>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--txt2)', lineHeight: 1.7, maxWidth: 520, margin: '0 auto 32px', fontWeight: 400 }}>
            PM Terminal tracks valuations, ARR, and secondary market prices from Forge, Hiive, and Notice — so you always know what your private portfolio is worth.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/app" style={{ textDecoration: 'none' }}>
              <button className="pm-btn pri" style={{ padding: '11px 26px', fontSize: 13, fontWeight: 700 }}>Open Portfolio Terminal →</button>
            </Link>
            <a href="#companies" style={{ textDecoration: 'none' }}>
              <button className="pm-btn" style={{ padding: '11px 26px', fontSize: 13 }}>Explore Companies</button>
            </a>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section style={{ marginBottom: 64 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 }}>
            {[
              { icon: '◈', title: 'Curated private universe', body: 'We track 27+ pre-IPO companies. Valuations update as new rounds close — no noise, no duplicates.' },
              { icon: '◉', title: 'Add your portfolio', body: 'Log your shares, entry price, and entry valuation. PM Terminal calculates cost basis, current value, MOIC, and IRR automatically.' },
              { icon: '◎', title: 'Secondary market pricing', body: 'Blended price is the median of Forge, Hiive, and Notice — the three largest private secondary markets.' },
              { icon: '✎', title: 'Projected value', body: 'Where data allows, we project forward based on ARR growth and sector comps. Estimates are always clearly labelled.' },
            ].map((f) => (
              <div key={f.title} style={{ background: 'var(--card)', border: '1px solid var(--div)', borderRadius: 12, padding: '20px 18px' }}>
                <div style={{ fontSize: 18, marginBottom: 10, color: 'var(--indigo)' }}>{f.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt)', marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 11, color: 'var(--txt2)', lineHeight: 1.65 }}>{f.body}</div>
              </div>
            ))}
          </div>
        </section>

        {/* COMPANY TABLE */}
        <section id="companies" style={{ marginBottom: 80 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--txt)', letterSpacing: '-0.02em' }}>Private Market Universe</div>
              <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 3 }}>
                Blended price = median of Forge · Hiive · Notice
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt3)', padding: '4px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--div)', borderRadius: 6 }}>
              {sorted.length} of {COMPANIES.length} companies
            </div>
          </div>

          {/* Sector filter */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {SECTORS.map((s) => (
              <button
                key={s}
                onClick={() => setSector(s)}
                style={{
                  fontSize: 10, fontWeight: 600, padding: '4px 11px', borderRadius: 20, cursor: 'pointer', border: '1px solid',
                  background: sector === s ? 'var(--indigo)' : 'rgba(255,255,255,0.03)',
                  borderColor: sector === s ? 'var(--indigo)' : 'var(--div)',
                  color: sector === s ? 'white' : 'var(--txt3)',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >{s}</button>
            ))}
          </div>

          {/* Table */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--div)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '10px 20px', borderBottom: '1px solid var(--div)', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Company</div>
              {([['Valuation', 'valuation'], ['ARR', 'arr'], ['Blended Price', 'price']] as [string, SortKey][]).map(([label, key]) => (
                <div
                  key={key}
                  onClick={() => handleSort(key)}
                  style={{ fontSize: 9, fontWeight: 700, color: sortKey === key ? 'var(--indigo)' : 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
                >
                  {label}{sortIcon(key)}
                </div>
              ))}
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'right' }}>Stage</div>
            </div>

            {sorted.map((co, idx) => {
              const blended = blendedPrice(co.forgePrice, co.hiivePrice, co.noticePrice);
              return (
                <div
                  key={co.id}
                  style={{
                    display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                    padding: '12px 20px', borderBottom: idx === sorted.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                    alignItems: 'center', transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Logo domain={co.domain} name={co.name} color={co.color} size={28} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)' }}>{co.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 1 }}>{co.sector}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--txt)', fontFamily: "'JetBrains Mono', monospace" }}>{fmtVal(co.currentValuationM)}</div>
                  <div style={{ textAlign: 'right', fontSize: 12, color: co.arrM !== null ? 'var(--txt2)' : 'var(--txt3)', fontFamily: "'JetBrains Mono', monospace" }}>{fmtArr(co.arrM)}</div>
                  <div style={{ textAlign: 'right' }}>
                    {blended !== null
                      ? <><span style={{ fontSize: 12, fontWeight: 700, color: co.color, fontFamily: "'JetBrains Mono', monospace" }}>${blended.toFixed(2)}</span><div style={{ fontSize: 9, color: 'var(--txt3)', marginTop: 1 }}>Forge · Hiive · Notice</div></>
                      : <span style={{ fontSize: 12, color: 'var(--txt3)', fontFamily: "'JetBrains Mono', monospace" }}>N/A</span>
                    }
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 9, padding: '3px 7px', background: 'rgba(255,255,255,0.06)', borderRadius: 4, color: 'var(--txt2)', fontWeight: 600 }}>{co.stage}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: 'center', marginTop: 12, fontSize: 10, color: 'var(--txt3)' }}>
            Secondary prices are estimates based on public secondary market activity. Not financial advice.
          </div>
        </section>

        {/* CTA */}
        <section style={{ textAlign: 'center', padding: '40px 24px 72px' }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(99,91,255,0.1) 0%, rgba(255,107,53,0.07) 100%)', border: '1px solid rgba(99,91,255,0.18)', borderRadius: 16, padding: '44px 32px' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--txt)', marginBottom: 10, letterSpacing: '-0.02em' }}>Ready to track your private portfolio?</div>
            <div style={{ fontSize: 13, color: 'var(--txt2)', marginBottom: 26, lineHeight: 1.7 }}>
              Sign up free. Add your positions and watch your portfolio update in real-time<br />as valuations change and secondary prices move.
            </div>
            <Link href="/app" style={{ textDecoration: 'none' }}>
              <button className="pm-btn pri" style={{ padding: '12px 30px', fontSize: 14, fontWeight: 700 }}>Create Free Account →</button>
            </Link>
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.06)', padding: '22px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="pm-logo" style={{ width: 26, height: 26, fontSize: 9 }}>PM</div>
          <span style={{ fontSize: 11, color: 'var(--txt3)' }}>PM Terminal · Private Markets Intelligence</span>
        </div>
        <div style={{ fontSize: 10, color: 'var(--txt3)' }}>Valuations and prices are estimates. Not financial advice.</div>
      </footer>
    </div>
  );
}
