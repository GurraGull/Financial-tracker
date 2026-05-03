'use client';

import { useState } from 'react';
import { COMPANIES, Company } from '@/lib/companies';
import { StoredPosition, makeId, fmtK, fmtM, fmtPct } from '@/lib/positions';

interface Props {
  initial?: StoredPosition | null;
  companies?: Company[];
  onClose: () => void;
  onSave: (pos: StoredPosition) => void;
}

const EMPTY = { companyId: '', shares: '', entrySharePrice: '', entryValuationM: '', entryDate: '', notes: '', carryPct: '', managementFeePct: '' };

export default function AddPositionModal({ initial, companies: liveCompanies, onClose, onSave }: Props) {
  const companies = liveCompanies ?? COMPANIES;
  const [form, setForm] = useState(
    initial
      ? {
          companyId: initial.companyId,
          shares: String(initial.shares),
          entrySharePrice: String(initial.entrySharePrice),
          entryValuationM: String(initial.entryValuationM),
          entryDate: initial.entryDate,
          notes: initial.notes,
          carryPct: initial.carryPct != null ? String(initial.carryPct) : '',
          managementFeePct: initial.managementFeePct != null ? String(initial.managementFeePct) : '',
        }
      : EMPTY
  );
  const [showFees, setShowFees] = useState(!!(initial?.carryPct || initial?.managementFeePct));

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const selectedCompany = COMPANIES.find((c) => c.id === form.companyId);

  const handleCompanyChange = (id: string) => {
    const co = COMPANIES.find((c) => c.id === id);
    setForm((f) => ({ ...f, companyId: id, entryValuationM: co ? String(co.currentValuationM) : f.entryValuationM }));
  };

  const shares = Number(form.shares) || 0;
  const entryPrice = Number(form.entrySharePrice) || 0;
  const entryVal = Number(form.entryValuationM) || 0;
  const costBasis = shares * entryPrice;
  const liveVal = selectedCompany?.currentValuationM ?? entryVal;
  const impliedCurrentPrice = entryPrice && entryVal ? (liveVal / entryVal) * entryPrice : 0;
  const impliedCurrentValue = shares * impliedCurrentPrice;
  const impliedReturn = costBasis > 0 ? ((impliedCurrentValue - costBasis) / costBasis) * 100 : 0;
  const isEdit = !!initial;

  const handleSave = () => {
    if (!form.companyId || !form.shares || !form.entrySharePrice || !form.entryValuationM || !form.entryDate) return;
    const co = COMPANIES.find((c) => c.id === form.companyId);
    onSave({
      id: initial?.id ?? makeId(),
      companyId: form.companyId,
      shares: Number(form.shares),
      entrySharePrice: Number(form.entrySharePrice),
      entryValuationM: Number(form.entryValuationM),
      currentValuationM: co?.currentValuationM ?? Number(form.entryValuationM),
      secondaryValuationM: co?.currentValuationM ?? Number(form.entryValuationM),
      entryDate: form.entryDate,
      notes: form.notes,
      ...(form.carryPct !== '' && { carryPct: Number(form.carryPct) }),
      ...(form.managementFeePct !== '' && { managementFeePct: Number(form.managementFeePct) }),
    });
    onClose();
  };

  return (
    <div className="pm-modal-bg" onClick={onClose}>
      <div className="pm-modal pm-fu" onClick={(e) => e.stopPropagation()}>
        <div className="pm-modal-title">{isEdit ? 'Edit Position' : 'Add Position'}</div>
        <div className="pm-modal-sub">Enter your investment details — current valuation is pulled from the database automatically</div>

        <div className="pm-form-grid">
          {/* Company */}
          <div className="pm-fg full">
            <div className="pm-fl">Company</div>
            <select className="pm-fi" value={form.companyId} onChange={(e) => handleCompanyChange(e.target.value)}>
              <option value="">Select a company…</option>
              {COMPANIES.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {fmtM(c.currentValuationM)} · {c.stage}</option>
              ))}
            </select>
          </div>

          {/* Shares + Entry Share Price */}
          <div className="pm-fg">
            <div className="pm-fl">Number of Shares</div>
            <input className="pm-fi" type="number" placeholder="500" min="1" value={form.shares} onChange={(e) => set('shares', e.target.value)} />
          </div>
          <div className="pm-fg">
            <div className="pm-fl">Entry Share Price ($)</div>
            <input className="pm-fi" type="number" placeholder="5,125" value={form.entrySharePrice} onChange={(e) => set('entrySharePrice', e.target.value)} />
          </div>

          {/* Entry Valuation + Entry Date */}
          <div className="pm-fg">
            <div className="pm-fl">Entry Valuation ($M)</div>
            <input className="pm-fi" type="number" placeholder="41,000" value={form.entryValuationM} onChange={(e) => set('entryValuationM', e.target.value)} />
          </div>
          <div className="pm-fg">
            <div className="pm-fl">Entry Date</div>
            <input className="pm-fi" type="date" value={form.entryDate} onChange={(e) => set('entryDate', e.target.value)} />
          </div>

          {/* Notes */}
          <div className="pm-fg full">
            <div className="pm-fl">Notes <span style={{ opacity: 0.5, fontWeight: 400 }}>(optional)</span></div>
            <input className="pm-fi" placeholder="e.g. Series B entry via AngelList" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>

          {/* Live preview */}
          {costBasis > 0 && (
            <div className="pm-fg full">
              <div className="pm-preview">
                <div>
                  <div className="pm-lp-label">Cost Basis</div>
                  <div className="pm-lp-val">{fmtK(costBasis)}</div>
                </div>
                <div>
                  <div className="pm-lp-label">Round Val (live)</div>
                  <div className="pm-lp-val" style={{ color: selectedCompany?.color }}>{fmtM(liveVal)}</div>
                </div>
                {impliedCurrentValue > 0 && (
                  <div>
                    <div className="pm-lp-label">Implied Value</div>
                    <div className="pm-lp-val">{fmtK(impliedCurrentValue)}</div>
                  </div>
                )}
                {costBasis > 0 && impliedCurrentValue > 0 && (
                  <div>
                    <div className="pm-lp-label">Implied Return</div>
                    <div className="pm-lp-val" style={{ color: impliedReturn >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtPct(impliedReturn)}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fund Fees — collapsible */}
          <div className="pm-fg full" style={{ marginTop: 4 }}>
            <button
              className="pm-btn"
              style={{ fontSize: 10, color: 'var(--txt3)', width: '100%', textAlign: 'left', borderStyle: 'dashed' }}
              onClick={() => setShowFees((v) => !v)}
            >
              {showFees ? '▾' : '▸'} Fund Fees <span style={{ opacity: 0.5 }}>(carry & management fee — optional)</span>
            </button>
          </div>

          {showFees && (
            <>
              <div className="pm-fg">
                <div className="pm-fl">Carry %</div>
                <input className="pm-fi" type="number" placeholder="e.g. 20" min="0" max="100" value={form.carryPct} onChange={(e) => set('carryPct', e.target.value)} />
              </div>
              <div className="pm-fg">
                <div className="pm-fl">Management Fee % / year</div>
                <input className="pm-fi" type="number" placeholder="e.g. 2" min="0" max="10" step="0.1" value={form.managementFeePct} onChange={(e) => set('managementFeePct', e.target.value)} />
              </div>
            </>
          )}
        </div>

        <div className="pm-modal-footer">
          <button className="pm-btn" onClick={onClose}>Cancel</button>
          <button className="pm-btn pri" onClick={handleSave} disabled={!form.companyId || !form.shares || !form.entrySharePrice || !form.entryValuationM || !form.entryDate}>
            {isEdit ? 'Save Changes →' : 'Add Position →'}
          </button>
        </div>
      </div>
    </div>
  );
}
