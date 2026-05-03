import { DerivedPosition, fmtK, fmtM, fmtPct, fmtX } from '@/lib/positions';

interface Props { positions: DerivedPosition[]; onAdd: () => void; }

export default function CardsView({ positions, onAdd }: Props) {
  if (positions.length === 0) {
    return (
      <div className="pm-empty">
        <div className="pm-empty-icon">◈</div>
        <div className="pm-empty-title">No positions yet</div>
        <div className="pm-empty-sub">Add your first holding to start tracking your private company investments.</div>
        <button className="pm-btn pri" style={{ marginTop: 8 }} onClick={onAdd}>+ Add Position</button>
      </div>
    );
  }

  return (
    <div className="pm-cards pm-fu" style={{ animationDelay: '0.04s' }}>
      {positions.map((p) => (
        <div key={p.id} className="pm-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div className="pm-co-av" style={{ background: p.color, width: 36, height: 36, borderRadius: 9 }}>{p.name[0]}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</div>
              <div className="pm-co-ticker">{p.ticker} · {p.sector}</div>
            </div>
            <span className="pm-pill" style={{ marginLeft: 'auto' }}>{p.stage}</span>
          </div>
          <div className="pm-card-mini">
            {[
              { l: 'Current Value', v: fmtK(p.currentValue), c: p.color },
              { l: 'Cost Basis', v: fmtK(p.costBasis), c: 'var(--txt)' },
              { l: 'MOIC', v: fmtX(p.multiple), c: 'var(--indigo)' },
              { l: 'Return', v: fmtPct(p.unrealizedPct), c: p.unrealizedPct >= 0 ? 'var(--green)' : 'var(--red)' },
            ].map((m) => (
              <div key={m.l} className="pm-card-mini-item">
                <div className="pm-cmi-label">{m.l}</div>
                <div className="pm-cmi-val" style={{ color: m.c }}>{m.v}</div>
              </div>
            ))}
          </div>
          <div className="pm-card-foot">
            <span>{p.shares.toLocaleString()} shares</span>
            <span>{p.allocation.toFixed(1)}% of portfolio</span>
            <span>{fmtM(p.currentValuationM)} val</span>
          </div>
        </div>
      ))}
    </div>
  );
}
