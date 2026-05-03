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
  onAdd: () => void;
}

const COLS = '180px 70px 110px 100px 110px 110px 100px 110px 80px 60px 80px 80px';

const TH_TIPS: Record<string, string> = {
  'Cost Basis': 'Total capital invested: shares × entry price',
  'Curr Value': 'Current value at latest round valuation',
  'Sec Value': 'Value using secondary market price (Forge · Hiive · Notice)',
  'Unreal P&L': 'Current value minus cost basis',
  'Return': 'Unrealized P&L as % of cost basis',
  'Mult': 'Multiple on invested capital (MOIC)',
  'Alloc': 'This position as % of total portfolio value',
};

export default function PositionsTable({ positions, expanded, sort, onExpand, onSort, onRemove, onEdit, onAdd }: Props) {
  const si = (k: string) => sort.key === k ? (sort.dir === -1 ? ' ↓' : ' ↑') : '';

  if (positions.length === 0) {
    return (
      <div className="pm-tbl">
        <div className="pm-empty">
          <div className="pm-empty-icon">◈</div>
          <div className="pm-empty-title">No positions yet</div>
          <div className="pm-empty-sub">Add your first holding to start tracking your private company investments.</div>
          <button className="pm-btn pri" style={{ marginTop: 8 }} onClick={onAdd}>+ Add Position</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pm-tbl pm-fu" style={{ animationDelay: '0.04s' }}>
      <div className="pm-th" style={{ gridTemplateColumns: COLS }}>
        <span>Company</span>
        <span onClick={() => onSort('shares')}>Shares{si('shares')}</span>
        {(['Cost Basis', 'Entry Price', 'Curr Value', 'Sec Value', 'Curr Price', 'Unreal P&L', 'Return', 'Mult', 'Alloc', 'Stage'] as const).map((h) => {
          const key = h === 'Cost Basis' ? 'costBasis' : h === 'Curr Value' ? 'currentValue' : h === 'Sec Value' ? 'secondaryValue' : h === 'Unreal P&L' ? 'unrealizedPL' : h === 'Return' ? 'unrealizedPct' : h === 'Mult' ? 'multiple' : '';
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
            <div className="pm-cell">{p.shares.toLocaleString()}</div>
            <div className="pm-cell">{fmtK(p.costBasis)}</div>
            <div className="pm-cell dim">{fmtK(p.entrySharePrice)}</div>
            <div className="pm-cell lg" style={{ color: p.color }}>{fmtK(p.currentValue)}</div>
            <div className="pm-cell dim">{fmtK(p.secondaryValue)}</div>
            <div className="pm-cell">{fmtK(p.currSharePrice)}</div>
            <div className={`pm-cell ${p.unrealizedPL >= 0 ? 'c-pos' : 'c-neg'}`}>
              {p.unrealizedPL >= 0 ? '+' : ''}{fmtK(p.unrealizedPL)}
            </div>
            <div className={`pm-cell ${p.unrealizedPct >= 0 ? 'c-pos' : 'c-neg'}`}>{fmtPct(p.unrealizedPct)}</div>
            <div className="pm-cell c-acc">{fmtX(p.multiple)}</div>
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
                  ['Entry Date', new Date(p.entryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })],
                  ['Entry Valuation', fmtM(p.entryValuationM)],
                  ['Entry Share Price', fmtK(p.entrySharePrice)],
                  ['Shares Held', p.shares.toLocaleString()],
                  ['Cost Basis', fmtK(p.costBasis)],
                ].map(([k, v]) => (
                  <div key={k} className="pm-exp-stat"><span className="pm-exp-key">{k}</span><span className="pm-exp-val">{v}</span></div>
                ))}
              </div>
              <div>
                <div className="pm-exp-title">Current Mark</div>
                {[
                  ['Current Valuation', fmtM(p.currentValuationM)],
                  ['Curr Share Price', fmtK(p.currSharePrice)],
                  ['Current Value', fmtK(p.currentValue)],
                  ['Secondary Valuation', fmtM(p.secondaryValuationM)],
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
                <div className="pm-exp-stat"><span className="pm-exp-key">Unrealized P&L</span><span className={`pm-exp-val ${p.unrealizedPL >= 0 ? 'c-pos' : 'c-neg'}`}>{p.unrealizedPL >= 0 ? '+' : ''}{fmtK(p.unrealizedPL)}</span></div>
                <div className="pm-exp-stat"><span className="pm-exp-key">Total Return</span><span className={`pm-exp-val ${p.unrealizedPct >= 0 ? 'c-pos' : 'c-neg'}`}>{fmtPct(p.unrealizedPct)}</span></div>
                <div className="pm-exp-stat">
                  <span className="pm-exp-key" data-tip="Multiple on invested capital — current value ÷ cost basis">MOIC</span>
                  <span className="pm-exp-val c-acc">{fmtX(p.multiple)}</span>
                </div>
                <div className="pm-exp-stat">
                  <span className="pm-exp-key" data-tip="Annualized return assuming same growth rate continues">Annualized IRR</span>
                  <span className="pm-exp-val c-pos">{fmtPct(p.annualizedRet)}</span>
                </div>
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
