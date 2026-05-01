import Donut from './Donut';
import { DerivedPosition, fmtM, fmtK, fmtPct, fmtX, fmtDays } from '@/lib/positions';

interface Props {
  positions: DerivedPosition[];
  totalCost: number;
  totalCurr: number;
  totalSec: number;
  totalPL: number;
  totalPLpct: number;
  avgMultiple: number;
  gainers: number;
}

export default function SidePanel({ positions, totalCost, totalCurr, totalSec, totalPL, totalPLpct, avgMultiple, gainers }: Props) {
  const segments = positions.map((p) => ({ color: p.color, pct: Math.round(p.allocation) }));
  const ranked = [...positions].sort((a, b) => b.multiple - a.multiple);

  return (
    <aside className="pm-side">
      <div className="pm-donut-wrap">
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--txt3)', width: '100%' }}>Allocation</div>
        <Donut segments={segments} size={110} />
        <div className="pm-alloc-list">
          {positions.map((p) => (
            <div key={p.id} className="pm-al-item">
              <div className="pm-al-dot" style={{ background: p.color }} />
              <div className="pm-al-name">{p.name}</div>
              <div className="pm-al-bar-wrap"><div className="pm-al-bar" style={{ width: `${Math.min(p.allocation, 100)}%`, background: p.color }} /></div>
              <div className="pm-al-pct">{p.allocation.toFixed(0)}%</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--div)' }} />

      <div style={{ padding: '12px 16px 6px', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--txt3)' }}>Performance Ranking</div>
      {ranked.map((p) => (
        <div key={p.id} className="pm-perf-item">
          <div className="pm-pi-left">
            <div className="pm-pi-dot" style={{ background: p.color }} />
            <div>
              <div className="pm-pi-name">{p.name}</div>
              <div className="pm-pi-sub">{fmtDays(p.days)} · {p.shares.toLocaleString()} sh</div>
            </div>
          </div>
          <div className="pm-pi-right">
            <div className="pm-pi-gain" style={{ color: p.unrealizedPct >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtX(p.multiple)}</div>
            <div className="pm-pi-pct">{fmtPct(p.unrealizedPct)}</div>
          </div>
        </div>
      ))}

      <div style={{ height: 1, background: 'var(--div)' }} />

      <div className="pm-sp">
        <div className="pm-sp-title">Portfolio Summary</div>
        {[
          { k: 'Total Deployed', v: fmtM(totalCost) },
          { k: 'Current Value', v: fmtM(totalCurr), c: 'var(--indigo)' },
          { k: 'Unrealized Gain', v: `${fmtM(totalPL)} (${fmtPct(totalPLpct)})`, c: 'var(--green)' },
          { k: 'Portfolio MOIC', v: fmtX(avgMultiple), c: 'var(--indigo)' },
          { k: 'Secondary Value', v: fmtM(totalSec) },
          { k: 'Active Positions', v: `${positions.length}` },
          { k: 'Gainers / Losers', v: `${gainers} / ${positions.length - gainers}` },
        ].map((row) => (
          <div key={row.k} className="pm-sum-row">
            <span className="pm-sum-key">{row.k}</span>
            <span className="pm-sum-val" style={{ color: row.c ?? 'var(--txt)' }}>{row.v}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
