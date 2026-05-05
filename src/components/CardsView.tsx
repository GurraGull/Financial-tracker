import { DerivedPosition, fmtK, fmtM, fmtPct, fmtX } from '@/lib/positions';
import CompanyLogo from './CompanyLogo';

interface Props { positions: DerivedPosition[]; }

export default function CardsView({ positions }: Props) {
  if (positions.length === 0) {
    return (
      <div className="pm-empty">
        <div className="pm-empty-icon">◈</div>
        <div className="pm-empty-title">No positions yet</div>
        <div className="pm-empty-sub">Click &quot;+ Add Position&quot; to track your investments.</div>
      </div>
    );
  }

  return (
    <div className="pm-cards pm-fu" style={{ animationDelay: '0.04s' }}>
      {positions.map((p) => (
        <div key={p.id} className="pm-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <CompanyLogo name={p.name} color={p.color} domain={p.domain} size={36} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</div>
              <div className="pm-co-ticker">{p.ticker} · {p.sector}</div>
            </div>
            <span className="pm-pill" style={{ marginLeft: 'auto' }}>{p.stage}</span>
          </div>
          <div className="pm-card-mini">
            {[
              { l: 'Estimated Value', v: fmtK(p.estimatedValue), c: p.color },
              { l: 'Net Value', v: fmtK(p.netEstimatedValue), c: 'var(--txt)' },
              { l: 'Cost Basis', v: fmtK(p.costBasis), c: 'var(--txt)' },
              { l: 'Net MOIC', v: fmtX(p.netMultiple), c: 'var(--indigo)' },
              { l: 'Gross Return', v: fmtPct(p.grossReturnPct), c: p.grossReturnPct >= 0 ? 'var(--green)' : 'var(--red)' },
            ].map((m) => (
              <div key={m.l} className="pm-card-mini-item">
                <div className="pm-cmi-label">{m.l}</div>
                <div className="pm-cmi-val" style={{ color: m.c }}>{m.v}</div>
              </div>
            ))}
          </div>
          <div className="pm-card-foot">
            <span>{p.holdingType}</span>
            <span>{p.allocation.toFixed(1)}% of portfolio</span>
            <span>{fmtM(p.latestValuationSignalM)} signal</span>
          </div>
        </div>
      ))}
    </div>
  );
}
