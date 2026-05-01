'use client';

import { useState } from 'react';
import { COMPANIES } from '@/lib/companies';
import { StoredPosition, makeId, fmtK, fmtM } from '@/lib/positions';

interface Props {
  initial?: StoredPosition | null;
  onClose: () => void;
  onSave: (pos: StoredPosition) => void;
}

const EMPTY = { companyId: '', shares: '', entrySharePrice: '', entryValuationM: '', currentValuationM: '', secondaryValuationM: '', entryDate: '', notes: '' };

export default function AddPositionModal({ initial, onClose, onSave }: Props) {
  const [form, setForm] = useState(
    initial
      ? { companyId: initial.companyId, shares: String(initial.shares), entrySharePrice: String(initial.entrySharePrice), entryValuationM: String(initial.entryValuationM), currentValuationM: String(initial.currentValuationM), secondaryValuationM: String(initial.secondaryValuationM), entryDate: initial.entryDate, notes: initial.notes }
      : EMPTY
  );

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleCompanyChange = (id: string) => {
    const co = COMPANIES.find((c) => c.id === id);
    set('companyId', id);
    if (co) {
      setForm((f) => ({ ...f, companyId: id, currentValuationM: String(co.currentValuationM), secondaryValuationM: String(co.currentValuationM) }));
    }
  };

  const costBasis = form.shares && form.entrySharePrice ? Number(form.shares) * Number(form.entrySharePrice) : 0;
  const isEdit = !!initial;

  const handleSave = () => {
    if (!form.companyId || !form.shares || !form.entrySharePrice || !form.entryValuationM || !form.entryDate) return;
    onSave({
      id: initial?.id ?? makeId(),
      companyId: form.companyId,
      shares: Number(form.shares),
      entrySharePrice: Number(form.entrySharePrice),
      entryValuationM: Number(form.entryValuationM),
      currentValuationM: Number(form.currentValuationM) || Number(form.entryValuationM),
      secondaryValuationM: Number(form.secondaryValuationM) || Number(form.entryValuationM),
      entryDate: form.entryDate,
      notes: form.notes,
    });
    onClose();
  };

  return (
    <div className="pm-modal-bg" onClick={onClose}>
      <div className="pm-modal pm-fu" onClick={(e) => e.stopPropagation()}>
        <div className="pm-modal-title">{isEdit ? 'Edit Position' : 'Add Position'}</div>
        <div className="pm-modal-sub">Track a private company investment in your portfolio</div>
        <div className="pm-form-grid">
          <div className="pm-fg full">
            <div className="pm-fl">Company</div>
            <select className="pm-fi" value={form.companyId} onChange={(e) => handleCompanyChange(e.target.value)}>
              <option value="">Select a company…</option>
              {COMPANIES.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {fmtM(c.currentValuationM)} · {c.stage}</option>
              ))}
            </select>
          </div>
          <div className="pm-fg">
            <div className="pm-fl">Shares</div>
            <input className="pm-fi" type="number" placeholder="500" value={form.shares} onChange={(e) => set('shares', e.target.value)} />
          </div>
          <div className="pm-fg">
            <div className="pm-fl">Entry Share Price ($)</div>
            <input className="pm-fi" type="number" placeholder="5125" value={form.entrySharePrice} onChange={(e) => set('entrySharePrice', e.target.value)} />
          </div>
          <div className="pm-fg">
            <div className="pm-fl">Entry Valuation ($M)</div>
            <input className="pm-fi" type="number" placeholder="41000" value={form.entryValuationM} onChange={(e) => set('entryValuationM', e.target.value)} />
          </div>
          <div className="pm-fg">
            <div className="pm-fl">Entry Date</div>
            <input className="pm-fi" type="date" value={form.entryDate} onChange={(e) => set('entryDate', e.target.value)} />
          </div>
          <div className="pm-fg">
            <div className="pm-fl">Current Valuation ($M)</div>
            <input className="pm-fi" type="number" placeholder="Auto-filled" value={form.currentValuationM} onChange={(e) => set('currentValuationM', e.target.value)} />
          </div>
          <div className="pm-fg">
            <div className="pm-fl">Secondary Valuation ($M)</div>
            <input className="pm-fi" type="number" placeholder="Optional" value={form.secondaryValuationM} onChange={(e) => set('secondaryValuationM', e.target.value)} />
          </div>
          <div className="pm-fg full">
            <div className="pm-fl">Notes</div>
            <input className="pm-fi" placeholder="e.g. Series B entry via AngelList" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
          {costBasis > 0 && (
            <div className="pm-fg full">
              <div className="pm-preview">
                <div><div className="pm-lp-label">Cost Basis</div><div className="pm-lp-val">{fmtK(costBasis)}</div></div>
                <div><div className="pm-lp-label">Shares</div><div className="pm-lp-val">{Number(form.shares).toLocaleString()}</div></div>
                <div><div className="pm-lp-label">Entry Val</div><div className="pm-lp-val">{fmtM(Number(form.entryValuationM))}</div></div>
              </div>
            </div>
          )}
        </div>
        <div className="pm-modal-footer">
          <button className="pm-btn" onClick={onClose}>Cancel</button>
          <button className="pm-btn pri" onClick={handleSave}>{isEdit ? 'Save Changes →' : 'Add Position →'}</button>
        </div>
      </div>
    </div>
  );
}
