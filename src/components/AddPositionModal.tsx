'use client';

import { useState } from 'react';
import { Company } from '@/lib/companies';
import { HoldingType, StoredPosition, makeId, fmtK, fmtM } from '@/lib/positions';

interface Props {
  companies: Company[];
  initial?: StoredPosition | null;
  onClose: () => void;
  onSave: (pos: StoredPosition) => void;
}

const HOLDING_TYPES: { value: HoldingType; label: string }[] = [
  { value: 'direct', label: 'Direct shares' },
  { value: 'spv', label: 'SPV' },
  { value: 'fund', label: 'Fund' },
  { value: 'secondary', label: 'Secondary purchase' },
  { value: 'other', label: 'Other' },
];

const EMPTY = {
  companyId: '',
  holdingType: 'direct',
  investmentAmount: '',
  currency: 'USD',
  purchaseDate: '',
  entryValuationM: '',
  shares: '',
  costPerShare: '',
  vehicleName: '',
  carryPct: '',
  annualManagementFeePct: '',
  oneTimeAdminFee: '',
  notes: '',
  includeInCommunityStats: false,
};

export default function AddPositionModal({ companies, initial, onClose, onSave }: Props) {
  const [form, setForm] = useState(
    initial
      ? {
          companyId: initial.companyId,
          holdingType: initial.holdingType,
          investmentAmount: String(initial.investmentAmount),
          currency: initial.currency,
          purchaseDate: initial.purchaseDate,
          entryValuationM: String(initial.entryValuationM),
          shares: initial.shares == null ? '' : String(initial.shares),
          costPerShare: initial.costPerShare == null ? '' : String(initial.costPerShare),
          vehicleName: initial.vehicleName,
          carryPct: String(initial.carryPct),
          annualManagementFeePct: String(initial.annualManagementFeePct),
          oneTimeAdminFee: String(initial.oneTimeAdminFee),
          notes: initial.notes,
          includeInCommunityStats: initial.includeInCommunityStats,
        }
      : EMPTY
  );

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const setBool = (k: string, v: boolean) => setForm((f) => ({ ...f, [k]: v }));

  const handleCompanyChange = (id: string) => {
    const co = companies.find((c) => c.id === id);
    set('companyId', id);
    if (co) {
      setForm((f) => ({ ...f, companyId: id, entryValuationM: f.entryValuationM || String(co.currentValuationM) }));
    }
  };

  const inferredInvestment = form.shares && form.costPerShare ? Number(form.shares) * Number(form.costPerShare) : 0;
  const investmentAmount = Number(form.investmentAmount || inferredInvestment || 0);
  const isEdit = !!initial;

  const handleSave = () => {
    if (!form.companyId || !investmentAmount || !form.entryValuationM || !form.purchaseDate) return;
    onSave({
      id: initial?.id ?? makeId(),
      companyId: form.companyId,
      holdingType: form.holdingType as HoldingType,
      investmentAmount,
      currency: form.currency || 'USD',
      purchaseDate: form.purchaseDate,
      entryValuationM: Number(form.entryValuationM),
      shares: form.shares ? Number(form.shares) : null,
      costPerShare: form.costPerShare ? Number(form.costPerShare) : null,
      vehicleName: form.vehicleName,
      carryPct: Number(form.carryPct || 0),
      annualManagementFeePct: Number(form.annualManagementFeePct || 0),
      oneTimeAdminFee: Number(form.oneTimeAdminFee || 0),
      notes: form.notes,
      includeInCommunityStats: !!form.includeInCommunityStats,
    });
    onClose();
  };

  return (
    <div className="pm-modal-bg" onClick={onClose}>
      <div className="pm-modal pm-fu" onClick={(e) => e.stopPropagation()}>
        <div className="pm-modal-title">{isEdit ? 'Edit Position' : 'Add Position'}</div>
        <div className="pm-modal-sub">Track a private company holding with fee-aware value estimates</div>
        <div className="pm-form-grid">
          <div className="pm-fg full">
            <div className="pm-fl">Company</div>
            <select className="pm-fi" value={form.companyId} onChange={(e) => handleCompanyChange(e.target.value)}>
              <option value="">Select a company…</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {fmtM(c.currentValuationM)} · {c.stage}</option>
              ))}
            </select>
          </div>
          <div className="pm-fg">
            <div className="pm-fl">Holding Type</div>
            <select className="pm-fi" value={form.holdingType} onChange={(e) => set('holdingType', e.target.value)}>
              {HOLDING_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div className="pm-fg">
            <div className="pm-fl">Investment Amount ($)</div>
            <input className="pm-fi" type="number" placeholder="10000" value={form.investmentAmount} onChange={(e) => set('investmentAmount', e.target.value)} />
          </div>
          <div className="pm-fg">
            <div className="pm-fl">Entry Valuation ($M)</div>
            <input className="pm-fi" type="number" placeholder="41000" value={form.entryValuationM} onChange={(e) => set('entryValuationM', e.target.value)} />
          </div>
          <div className="pm-fg">
            <div className="pm-fl">Purchase Date</div>
            <input className="pm-fi" type="date" value={form.purchaseDate} onChange={(e) => set('purchaseDate', e.target.value)} />
          </div>
          <div className="pm-fg">
            <div className="pm-fl">Shares (optional)</div>
            <input className="pm-fi" type="number" placeholder="500" value={form.shares} onChange={(e) => set('shares', e.target.value)} />
          </div>
          <div className="pm-fg">
            <div className="pm-fl">Cost per Share ($ optional)</div>
            <input className="pm-fi" type="number" placeholder="25" value={form.costPerShare} onChange={(e) => set('costPerShare', e.target.value)} />
          </div>
          <div className="pm-fg">
            <div className="pm-fl">Vehicle Name</div>
            <input className="pm-fi" placeholder="Optional SPV or fund name" value={form.vehicleName} onChange={(e) => set('vehicleName', e.target.value)} />
          </div>
          <div className="pm-fg">
            <div className="pm-fl">Carry %</div>
            <input className="pm-fi" type="number" placeholder="20" value={form.carryPct} onChange={(e) => set('carryPct', e.target.value)} />
          </div>
          <div className="pm-fg">
            <div className="pm-fl">Annual Fee %</div>
            <input className="pm-fi" type="number" placeholder="2" value={form.annualManagementFeePct} onChange={(e) => set('annualManagementFeePct', e.target.value)} />
          </div>
          <div className="pm-fg">
            <div className="pm-fl">One-Time Admin Fee ($)</div>
            <input className="pm-fi" type="number" placeholder="0" value={form.oneTimeAdminFee} onChange={(e) => set('oneTimeAdminFee', e.target.value)} />
          </div>
          <div className="pm-fg full">
            <div className="pm-fl">Notes</div>
            <input className="pm-fi" placeholder="e.g. Series B entry via AngelList" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
          <div className="pm-fg full" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input id="community-stats" type="checkbox" checked={!!form.includeInCommunityStats} onChange={(e) => setBool('includeInCommunityStats', e.target.checked)} />
            <label htmlFor="community-stats" style={{ fontSize: 11, color: 'var(--txt2)' }}>Include this holding in future anonymous community stats</label>
          </div>
          {investmentAmount > 0 && (
            <div className="pm-fg full">
              <div className="pm-preview">
                <div><div className="pm-lp-label">Investment</div><div className="pm-lp-val">{fmtK(investmentAmount)}</div></div>
                <div><div className="pm-lp-label">Shares</div><div className="pm-lp-val">{form.shares ? Number(form.shares).toLocaleString() : '—'}</div></div>
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
