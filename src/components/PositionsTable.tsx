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

// Company | Shares | Cost Basis | Round Val | Curr Value | Forge | Hiive | Notice | P&L | Return
const COLS = '190px 60px 95px 95px 100px 70px 70px 70px 100px 72px';

function Na() {
  return <span style={{ color: 'var(--txt3)', fontSize: 10 }}>N/A</span>;
}

function SecPrice({ price }: { price: number | null }) {
  if (price === null) return <Na />;
  return <span>${price.toFixed(2)}</span>;
}

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
        <span onClick={() => onSort('shares')} style={{ cursor: 'pointer' }}>Shares{si('shares')}</span>
        <span onClick={() => onSort('costBasis')} style={{ cursor: 'pointer' }} data-tip="Total capital deployed">Cost Basis{si('costBasis')}</span>
        <span data-tip="Current company round valuation from database">Round Val</span>
        <span onClick={() => onSort('currentValue')} style={{ cursor: 'pointer' }} data-tip="Your shares valued at current round">Curr Value{si('currentValue')}</span>
        <span data-tip="Latest Forge secondary market share price">Forge</span>
        <span data-tip="Latest Hiive secondary market share price">Hiive</span>
        <span data-tip="Latest Notice secondary market share price">Notice</span>
        <span onClick={() => onSort('unrealizedPL')} style={{ cursor: 'pointer' }} data-tip="Unrealized gain / loss">P&amp;L{si('unrealizedPL')}</span>
        <span onClick={() => onSort('unrealizedPct')} style={{ cursor: 'pointer' }} data-tip="Return as % of cost basis">Return{si('unrealizedPct')}</span>
      </div>

      {positions.map((p) => (
        <div key={p.id}>
          <div
            className={`pm-tr ${expanded === p.id ? 'exp' : ''}`}
            style={{ gridTemplateColumns: COLS }}
            onClick={() => onExpand(p.id)}
          >
            <div className="pm-co-cell">
              <CompanyLogo name={p.name} color={p.color} domain={p.domain} size={30} />
              <div>
                <div className="pm-co-name">{p.name}</div>
                <div className="pm-co-ticker">{p.ticker}</div>
              </div>
            </div>
            <div className="pm-cell">{p.shares.toLocaleString()}</div>
            <div className="pm-cell">{fmtK(p.costBasis)}</div>
            <div className="pm-cell dim">{fmtM(p.liveValuationM)}</div>
            <div className="pm-cell lg" style={{ color: p.color }}>{fmtK(p.currentValue)}</div>
            <div className="pm-cell dim"><SecPrice price={p.forgeSharePrice} /></div>
            <div className="pm-cell dim"><SecPrice price={p.hiiveSharePrice} /></div>
            <div className="pm-cell dim"><SecPrice price={p.noticeSharePrice} /></div>
            <div className={`pm-cell ${p.unrealizedPL >= 0 ? 'c-pos' : 'c-neg'}`}>
              {p.unrealizedPL >= 0 ? '+' : ''}{fmtK(p.unrealizedPL)}
            </div>
            <div className={`pm-cell ${p.unrealizedPct >= 0 ? 'c-pos' : 'c-neg'}`}>{fmtPct(p.unrealizedPct)}</div>
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
                  ['Days Held', fmtDays(p.days)],
                ].map(([k, v]) => (
                  <div key={k} className="pm-exp-stat"><span className="pm-exp-key">{k}</span><span className="pm-exp-val">{v}</span></div>
                ))}
              </div>
              <div>
                <div className="pm-exp-title">Current Mark</div>
                {[
                  ['Round Valuation', fmtM(p.liveValuationM)],
                  ['Curr Share Price', fmtK(p.currSharePrice)],
                  ['Current Value', fmtK(p.currentValue)],
                  ['Portfolio Weight', `${p.allocation.toFixed(1)}%`],
                ].map(([k, v]) => (
                  <div key={k} className="pm-exp-stat"><span className="pm-exp-key">{k}</span><span className="pm-exp-val c-acc">{v}</span></div>
                ))}
                <div style={{ marginTop: 8 }}>
                  <div className="pm-exp-title" style={{ marginBottom: 4 }}>Secondary Prices</div>
                  <div className="pm-exp-stat"><span className="pm-exp-key">Forge</span><span className="pm-exp-val">{p.forgeSharePrice !== null ? `$${p.forgeSharePrice.toFixed(2)}` : 'N/A'}</span></div>
                  <div className="pm-exp-stat"><span className="pm-exp-key">Hiive</span><span className="pm-exp-val">{p.hiiveSharePrice !== null ? `$${p.hiiveSharePrice.toFixed(2)}` : 'N/A'}</span></div>
                  <div className="pm-exp-stat"><span className="pm-exp-key">Notice</span><span className="pm-exp-val">{p.noticeSharePrice !== null ? `$${p.noticeSharePrice.toFixed(2)}` : 'N/A'}</span></div>
                  <div className="pm-exp-stat"><span className="pm-exp-key">Secondary Value</span><span className="pm-exp-val">{fmtK(p.secondaryValue)}</span></div>
                </div>
              </div>
              <div>
                <div className="pm-exp-title">Performance</div>
                <div className="pm-exp-stat"><span className="pm-exp-key">Unrealized P&L</span><span className={`pm-exp-val ${p.unrealizedPL >= 0 ? 'c-pos' : 'c-neg'}`}>{p.unrealizedPL >= 0 ? '+' : ''}{fmtK(p.unrealizedPL)}</span></div>
                <div className="pm-exp-stat"><span className="pm-exp-key">Return</span><span className={`pm-exp-val ${p.unrealizedPct >= 0 ? 'c-pos' : 'c-neg'}`}>{fmtPct(p.unrealizedPct)}</span></div>
                <div className="pm-exp-stat"><span className="pm-exp-key" data-tip="Multiple on invested capital">MOIC</span><span className="pm-exp-val c-acc">{fmtX(p.multiple)}</span></div>
                <div className="pm-exp-stat"><span className="pm-exp-key" data-tip="Annualized return assuming same growth rate continues">Annualized IRR</span><span className="pm-exp-val c-pos">{fmtPct(p.annualizedRet)}</span></div>
                {(p.carryPct || p.managementFeePct) ? (
                  <>
                    <div style={{ marginTop: 8 }}>
                      <div className="pm-exp-title" style={{ marginBottom: 4 }}>Fund Fees</div>
                    </div>
                    {p.carryPct ? <div className="pm-exp-stat"><span className="pm-exp-key">Carry ({p.carryPct}%)</span><span className="pm-exp-val c-neg">−{fmtK(p.carryFee)}</span></div> : null}
                    {p.managementFeePct ? <div className="pm-exp-stat"><span className="pm-exp-key">Mgmt Fee ({p.managementFeePct}%/yr)</span><span className="pm-exp-val c-neg">−{fmtK(p.managementFeeTotal)}</span></div> : null}
                    <div className="pm-exp-stat" style={{ marginTop: 4, paddingTop: 4, borderTop: '1px solid var(--div)' }}>
                      <span className="pm-exp-key">Net P&L</span>
                      <span className={`pm-exp-val ${p.netUnrealizedPL >= 0 ? 'c-pos' : 'c-neg'}`}>{p.netUnrealizedPL >= 0 ? '+' : ''}{fmtK(p.netUnrealizedPL)}</span>
                    </div>
                  </>
                ) : null}
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
