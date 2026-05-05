'use client';

import { DerivedPosition, fmtK, fmtM, fmtPct, fmtX, fmtDays, StoredPosition } from '@/lib/positions';
import CompanyLogo from './CompanyLogo';

interface SortState { key: string; dir: number; }
interface Props {
  positions: DerivedPosition[];
  expanded: string | null;
  sort: SortState;
  onExpand: (id: string) => void;
  onSort: (key: string) => void;
  onRemove: (id: string) => void;
  onEdit: (pos: StoredPosition) => void;
}

const COLS = '180px 84px 110px 110px 110px 110px 110px 90px 80px 80px 80px';

const TH_TIPS: Record<string, string> = {
  'Cost Basis': 'Total capital invested: shares × entry price',
  'Est Value': 'Estimated value using latest valuation signal',
  'Sec Value': 'Value using secondary market price (Forge · Hiive · Notice)',
  'Gross Gain': 'Estimated value minus cost basis',
  'Gross %': 'Gross gain as % of cost basis',
  'Gross MOIC': 'Estimated value ÷ cost basis',
  'Net MOIC': 'Net estimated value ÷ cost basis after fees',
  'Alloc': 'This position as % of total portfolio value',
};

export default function PositionsTable({ positions, expanded, sort, onExpand, onSort, onRemove, onEdit }: Props) {
  const si = (k: string) => sort.key === k ? (sort.dir === -1 ? ' ↓' : ' ↑') : '';

  if (positions.length === 0) {
    return (
      <div className="pm-tbl">
        <div className="pm-empty">
          <div className="pm-empty-icon">◈</div>
          <div className="pm-empty-title">No positions yet</div>
          <div className="pm-empty-sub">Add your first private stock, SPV, or fund position to start tracking it.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="pm-tbl pm-fu" style={{ animationDelay: '0.04s' }}>
      <div className="pm-th" style={{ gridTemplateColumns: COLS }}>
        <span>Company</span>
        <span onClick={() => onSort('holdingType')}>Type{si('holdingType')}</span>
        {(['Cost Basis', 'Est Value', 'Sec Value', 'Gross Gain', 'Gross %', 'Gross MOIC', 'Net MOIC', 'Alloc', 'Stage'] as const).map((h) => {
          const key =
            h === 'Cost Basis' ? 'costBasis' :
            h === 'Est Value' ? 'estimatedValue' :
            h === 'Sec Value' ? 'secondaryValue' :
            h === 'Gross Gain' ? 'grossGain' :
            h === 'Gross %' ? 'grossReturnPct' :
            h === 'Gross MOIC' ? 'grossMultiple' :
            h === 'Net MOIC' ? 'netMultiple' : '';
          const sortable = !!key;
          return (
            <span key={h} data-tip={TH_TIPS[h] ?? undefined} onClick={sortable ? () => onSort(key) : undefined} style={{ cursor: sortable ? 'pointer' : 'default' }}>
              {h}{sortable ? si(key) : ''}
            </span>
          );
        })}
      </div>

      {positions.map((p) => (
        <div key={p.id}>
          <div
            className={`pm-tr ${expanded === p.id ? 'exp' : ''}`}
            style={{ gridTemplateColumns: COLS }}
            onClick={() => onExpand(p.id)}
          >
            <div className="pm-co-cell">
              <CompanyLogo name={p.name} color={p.color} domain={p.domain} size={32} />
              <div>
                <div className="pm-co-name">{p.name}</div>
                <div className="pm-co-ticker">{p.ticker}</div>
              </div>
            </div>
            <div className="pm-cell">{p.holdingType}</div>
            <div className="pm-cell">{fmtK(p.costBasis)}</div>
            <div className="pm-cell lg" style={{ color: p.color }}>{fmtK(p.estimatedValue)}</div>
            <div className="pm-cell dim">{fmtK(p.secondaryValue)}</div>
            <div className={`pm-cell ${p.grossGain >= 0 ? 'c-pos' : 'c-neg'}`}>
              {p.grossGain >= 0 ? '+' : ''}{fmtK(p.grossGain)}
            </div>
            <div className={`pm-cell ${p.grossReturnPct >= 0 ? 'c-pos' : 'c-neg'}`}>{fmtPct(p.grossReturnPct)}</div>
            <div className="pm-cell c-acc">{fmtX(p.grossMultiple)}</div>
            <div className="pm-cell c-acc">{fmtX(p.netMultiple)}</div>
            <div className="pm-alloc-wrap">
              <div className="pm-alloc-bar">
                <div className="pm-alloc-fill" style={{ width: `${Math.min(p.allocation, 100)}%`, background: p.color }} />
              </div>
              <div className="pm-alloc-pct">{p.allocation.toFixed(1)}%</div>
            </div>
            <span className="pm-pill">{p.stage}</span>
          </div>

          {expanded === p.id && (
            <div className="pm-exp-row">
              <div>
                <div className="pm-exp-title">Entry Details</div>
                {[
                  ['Purchase Date', new Date(p.purchaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })],
                  ['Holding Type', p.holdingType],
                  ['Entry Valuation', fmtM(p.entryValuationM)],
                  ['Vehicle', p.vehicleName || '—'],
                  ['Shares Held', p.shares ? p.shares.toLocaleString() : '—'],
                  ['Cost / Share', p.costPerShare ? fmtK(p.costPerShare) : '—'],
                  ['Cost Basis', fmtK(p.costBasis)],
                ].map(([k, v]) => (
                  <div key={k} className="pm-exp-stat"><span className="pm-exp-key">{k}</span><span className="pm-exp-val">{v}</span></div>
                ))}
              </div>
              <div>
                <div className="pm-exp-title">Current Mark</div>
                {[
                  ['Latest Valuation Signal', fmtM(p.latestValuationSignalM)],
                  ['Indicative Secondary Price', p.indicativeSecondaryPrice ? fmtK(p.indicativeSecondaryPrice) : '—'],
                  ['Estimated Value', fmtK(p.estimatedValue)],
                  ['Secondary Value', fmtK(p.secondaryValue)],
                ].map(([k, v], i) => (
                  <div key={k} className="pm-exp-stat">
                    <span className="pm-exp-key">{k}</span>
                    <span className={`pm-exp-val${i === 1 || i === 2 ? ' c-acc' : ''}`}>{v}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="pm-exp-title">Performance</div>
                <div className="pm-exp-stat"><span className="pm-exp-key">Gross Gain</span><span className={`pm-exp-val ${p.grossGain >= 0 ? 'c-pos' : 'c-neg'}`}>{p.grossGain >= 0 ? '+' : ''}{fmtK(p.grossGain)}</span></div>
                <div className="pm-exp-stat"><span className="pm-exp-key">Gross Return</span><span className={`pm-exp-val ${p.grossReturnPct >= 0 ? 'c-pos' : 'c-neg'}`}>{fmtPct(p.grossReturnPct)}</span></div>
                <div className="pm-exp-stat">
                  <span className="pm-exp-key" data-tip="Estimated value ÷ cost basis">Gross MOIC</span>
                  <span className="pm-exp-val c-acc">{fmtX(p.grossMultiple)}</span>
                </div>
                <div className="pm-exp-stat"><span className="pm-exp-key">Carry Cost</span><span className="pm-exp-val">{fmtK(p.carryAmount)}</span></div>
                <div className="pm-exp-stat"><span className="pm-exp-key">Mgmt Fee Est.</span><span className="pm-exp-val">{fmtK(p.managementFeeEstimate)}</span></div>
                <div className="pm-exp-stat"><span className="pm-exp-key">Net Value</span><span className="pm-exp-val c-acc">{fmtK(p.netEstimatedValue)}</span></div>
                <div className="pm-exp-stat"><span className="pm-exp-key">Net MOIC</span><span className="pm-exp-val c-acc">{fmtX(p.netMultiple)}</span></div>
                <div className="pm-exp-stat"><span className="pm-exp-key">Days Held</span><span className="pm-exp-val">{fmtDays(p.days)}</span></div>
                <div className="pm-exp-stat"><span className="pm-exp-key">Portfolio Weight</span><span className="pm-exp-val">{p.allocation.toFixed(1)}%</span></div>
              </div>
              <div className="pm-exp-actions">
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--txt3)', marginBottom: 4 }}>Actions</div>
                <button className="pm-btn" style={{ width: '100%', textAlign: 'left' }} onClick={(e) => { e.stopPropagation(); onEdit(p); }}>Edit Position</button>
                <button className="pm-btn danger" style={{ width: '100%', textAlign: 'left' }} onClick={(e) => { e.stopPropagation(); onRemove(p.id); }}>Remove</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
