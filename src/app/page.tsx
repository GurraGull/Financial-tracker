'use client';

import Link from 'next/link';
import { COMPANIES } from '@/lib/companies';

function fmtVal(m: number) {
  if (m >= 1_000_000) return `$${(m / 1_000_000).toFixed(1)}T`;
  if (m >= 1_000) return `$${(m / 1_000).toFixed(0)}B`;
  return `$${m}M`;
}

function fmtArr(m: number) {
  if (m >= 1_000) return `$${(m / 1_000).toFixed(1)}B`;
  return `$${m}M`;
}

function median(a: number, b: number, c: number) {
  const s = [a, b, c].sort((x, y) => x - y);
  return s[1];
}

const sorted = [...COMPANIES].sort((a, b) => b.currentValuationM - a.currentValuationM);

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: 'var(--txt)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="pm-bg" />

      {/* NAV */}
      <nav style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: 60, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="pm-logo" style={{ width: 36, height: 36, fontSize: 12, flexShrink: 0 }}>PM</div>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--txt)', letterSpacing: '-0.01em' }}>PM Terminal</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/app" style={{ textDecoration: 'none' }}>
            <button className="pm-btn">Sign In</button>
          </Link>
          <Link href="/app" style={{ textDecoration: 'none' }}>
            <button className="pm-btn pri">Get Started</button>
          </Link>
        </div>
      </nav>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>

        {/* HERO */}
        <section style={{ padding: '80px 0 64px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'rgba(99,91,255,0.12)', border: '1px solid rgba(99,91,255,0.3)', borderRadius: 20, marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#635BFF', display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: '#635BFF', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Private Markets Intelligence</span>
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, lineHeight: 1.12, letterSpacing: '-0.03em', margin: '0 0 20px', color: '#f0f0f8' }}>
            Track the companies<br />
            <span style={{ background: 'linear-gradient(135deg, #635BFF 0%, #FF6B35 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              before they go public
            </span>
          </h1>
          <p style={{ fontSize: 17, color: 'var(--txt2)', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 36px', fontWeight: 400 }}>
            PM Terminal tracks private company valuations, ARR, and real-time secondary market prices from Forge, Hiive, and Notice — so you always know what your portfolio is worth.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/app" style={{ textDecoration: 'none' }}>
              <button className="pm-btn pri" style={{ padding: '12px 28px', fontSize: 14, fontWeight: 600 }}>Open Portfolio Terminal →</button>
            </Link>
            <a href="#companies" style={{ textDecoration: 'none' }}>
              <button className="pm-btn" style={{ padding: '12px 28px', fontSize: 14 }}>Explore Companies</button>
            </a>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section style={{ marginBottom: 72 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {[
              { icon: '◈', title: 'Track Every Private Company', body: 'We monitor 27+ pre-IPO companies — valuations updated as new rounds close or credible estimates emerge.' },
              { icon: '◉', title: 'Add Your Own Portfolio', body: 'Log your shares, entry price, and entry valuation. The terminal calculates your cost basis, current value, P&L, and annualized return automatically.' },
              { icon: '◎', title: 'Secondary Market Pricing', body: 'Blended share price is the median of Forge, Hiive, and Notice — the three largest private secondary markets. Updated as trades clear.' },
              { icon: '✎', title: 'Projected Value', body: 'Where public data allows, we project forward valuations based on ARR growth multiples and sector comps. Marks are clearly labelled as estimates.' },
            ].map((f) => (
              <div key={f.title} style={{ background: 'var(--card)', border: '1px solid var(--div)', borderRadius: 12, padding: '22px 20px' }}>
                <div style={{ fontSize: 20, marginBottom: 12, color: 'var(--indigo)' }}>{f.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 12, color: 'var(--txt2)', lineHeight: 1.65 }}>{f.body}</div>
              </div>
            ))}
          </div>
        </section>

        {/* COMPANY TABLE */}
        <section id="companies" style={{ marginBottom: 80 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--txt)', letterSpacing: '-0.02em' }}>Private Market Universe</div>
              <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 4 }}>Blended price = median of Forge · Hiive · Notice secondary trades</div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt3)', padding: '5px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--div)', borderRadius: 6 }}>
              {COMPANIES.length} companies tracked
            </div>
          </div>

          <div style={{ background: 'var(--card)', border: '1px solid var(--div)', borderRadius: 12, overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '10px 20px', borderBottom: '1px solid var(--div)', background: 'rgba(255,255,255,0.02)' }}>
              {['Company', 'Valuation', 'ARR', 'Blended Price', 'Stage'].map((h, i) => (
                <div key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: i > 0 ? 'right' : 'left' }}>{h}</div>
              ))}
            </div>

            {/* Table rows */}
            {sorted.map((co, idx) => {
              const blended = median(co.forgePrice, co.hiivePrice, co.noticePrice);
              const isLast = idx === sorted.length - 1;
              return (
                <div
                  key={co.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                    padding: '13px 20px',
                    borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
                    alignItems: 'center',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: co.color, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{co.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 1 }}>{co.sector}</div>
                    </div>
                  </div>
                  {/* Valuation */}
                  <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 600, color: 'var(--txt)', fontFamily: "'JetBrains Mono', monospace" }}>{fmtVal(co.currentValuationM)}</div>
                  {/* ARR */}
                  <div style={{ textAlign: 'right', fontSize: 13, color: 'var(--txt2)', fontFamily: "'JetBrains Mono', monospace" }}>{fmtArr(co.arrM)}</div>
                  {/* Blended price */}
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: co.color, fontFamily: "'JetBrains Mono', monospace" }}>${blended.toFixed(2)}</span>
                    <div style={{ fontSize: 9, color: 'var(--txt3)', marginTop: 1 }}>Forge · Hiive · Notice</div>
                  </div>
                  {/* Stage */}
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 10, padding: '3px 8px', background: 'rgba(255,255,255,0.06)', borderRadius: 4, color: 'var(--txt2)', fontWeight: 600 }}>{co.stage}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: 'center', marginTop: 14, fontSize: 11, color: 'var(--txt3)' }}>
            Secondary prices are estimates based on public secondary market activity. Not financial advice.
          </div>
        </section>

        {/* CTA */}
        <section style={{ textAlign: 'center', padding: '48px 24px 80px' }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(99,91,255,0.12) 0%, rgba(255,107,53,0.08) 100%)', border: '1px solid rgba(99,91,255,0.2)', borderRadius: 16, padding: '48px 32px' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--txt)', marginBottom: 12, letterSpacing: '-0.02em' }}>Ready to track your private portfolio?</div>
            <div style={{ fontSize: 14, color: 'var(--txt2)', marginBottom: 28, lineHeight: 1.6 }}>
              Sign up for free. Add your positions and watch your portfolio update in real-time<br />as valuations change and secondary market prices move.
            </div>
            <Link href="/app" style={{ textDecoration: 'none' }}>
              <button className="pm-btn pri" style={{ padding: '13px 32px', fontSize: 14, fontWeight: 700 }}>Create Free Account →</button>
            </Link>
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="pm-logo" style={{ width: 28, height: 28, fontSize: 10 }}>PM</div>
          <span style={{ fontSize: 12, color: 'var(--txt3)' }}>PM Terminal · Private Markets Intelligence</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--txt3)' }}>Valuations and prices are estimates. Not financial advice.</div>
      </footer>
    </div>
  );
}
