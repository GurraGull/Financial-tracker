'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';
import { Company } from '@/lib/companies';
import { fetchCompanies, saveCompany, addSecondaryPrice, fetchSecondaryPrices } from '@/lib/companies-db';

type SecondaryMap = Record<string, { forge?: number; hiive?: number; notice?: number; lastUpdated?: string }>;
const NEW_COMPANY_ID = '__new__';

function slugifyCompanyId(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function emptyCompanyDraft(): Company {
  return {
    id: '',
    name: '',
    ticker: '',
    sector: 'Other',
    color: '#635BFF',
    currentValuationM: 0,
    lastRoundDate: new Date().toISOString().slice(0, 10),
    stage: 'Pre-IPO',
    description: '',
    arrM: 0,
    forgePrice: 0,
    hiivePrice: 0,
    noticePrice: 0,
    domain: '',
  };
}

function fmtVal(m: number) {
  if (m >= 1_000_000) return `$${(m / 1_000_000).toFixed(2)}T`;
  if (m >= 1_000) return `$${(m / 1_000).toFixed(1)}B`;
  return `$${m}M`;
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(() => (getSupabase() ? null : false));
  const [companies, setCompanies] = useState<Company[]>([]);
  const [secondary, setSecondary] = useState<SecondaryMap>({});
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Company>>({});
  const [secDraft, setSecDraft] = useState<{ forge: string; hiive: string; notice: string; notes: string }>({ forge: '', hiive: '', notice: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const sortCompanies = (rows: Company[]) =>
    [...rows].sort((a, b) => b.currentValuationM - a.currentValuationM);

  /* check auth */
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;

    let cancelled = false;
    sb.auth.getSession().then(({ data }) => {
      if (!cancelled) setAuthed(!!data.session?.user);
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((_ev, s) => setAuthed(!!s?.user));
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  /* load data */
  useEffect(() => {
    if (!authed) return;
    fetchCompanies().then(({ companies: rows, error }) => {
      setDbError(error);
      setCompanies(rows);
    });
    fetchSecondaryPrices().then(setSecondary);
  }, [authed]);

  const startEdit = (co: Company) => {
    setEditing(co.id);
    setDraft({ ...co });
    const sec = secondary[co.id] ?? {};
    setSecDraft({ forge: String(sec.forge ?? co.forgePrice), hiive: String(sec.hiive ?? co.hiivePrice), notice: String(sec.notice ?? co.noticePrice), notes: '' });
  };

  const startCreate = () => {
    setEditing(NEW_COMPANY_ID);
    setDraft(emptyCompanyDraft());
    setSecDraft({ forge: '', hiive: '', notice: '', notes: '' });
  };

  const handleSave = async () => {
    if (!editing || !draft) return;
    setSaving(true);
    const creating = editing === NEW_COMPANY_ID;
    const base = creating ? emptyCompanyDraft() : companies.find((c) => c.id === editing);
    if (!base) {
      showToast('Company not found', false);
      setSaving(false);
      return;
    }

    const draftName = String(draft.name ?? base.name).trim();
    const draftId = String(draft.id ?? (creating ? slugifyCompanyId(draftName) : base.id)).trim();
    const draftTicker = String(draft.ticker ?? base.ticker).trim().toUpperCase();

    if (!draftName || !draftId || !draftTicker) {
      showToast('Name, ID, and ticker are required', false);
      setSaving(false);
      return;
    }

    if (creating && companies.some((c) => c.id === draftId)) {
      showToast('A company with that ID already exists', false);
      setSaving(false);
      return;
    }

    const updated: Company = {
      ...base,
      ...draft,
      id: draftId,
      name: draftName,
      ticker: draftTicker,
      sector: String(draft.sector ?? base.sector).trim() || 'Other',
      description: String(draft.description ?? base.description).trim(),
      domain: String(draft.domain ?? base.domain).trim(),
    } as Company;

    const err = await saveCompany(updated);
    if (err) { showToast(err, false); setSaving(false); return; }

    /* save secondary prices if changed */
    const orig = secondary[updated.id] ?? {};
    const sources: Array<'forge' | 'hiive' | 'notice'> = ['forge', 'hiive', 'notice'];
    for (const src of sources) {
      const val = parseFloat(secDraft[src]);
      if (!isNaN(val) && val !== orig[src]) {
        await addSecondaryPrice(updated.id, src, val, secDraft.notes);
      }
    }

    setCompanies((prev) => sortCompanies(creating ? [...prev, updated] : prev.map((c) => (c.id === updated.id ? updated : c))));
    setSecondary((prev) => ({
      ...prev,
      [updated.id]: {
        forge: parseFloat(secDraft.forge) || orig.forge,
        hiive: parseFloat(secDraft.hiive) || orig.hiive,
        notice: parseFloat(secDraft.notice) || orig.notice,
        lastUpdated: new Date().toISOString(),
      },
    }));
    setEditing(null);
    setSaving(false);
    showToast('Saved');
  };

  const filtered = companies.filter((co) =>
    co.name.toLowerCase().includes(search.toLowerCase()) || co.sector.toLowerCase().includes(search.toLowerCase())
  );

  /* ── auth gate ── */
  if (authed === null) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060912' }}>
        <div className="pm-bg" />
        <div style={{ fontSize: 11, color: 'var(--txt3)', position: 'relative', zIndex: 1 }}>Loading…</div>
      </div>
    );
  }

  if (!authed) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060912' }}>
        <div className="pm-bg" />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div className="pm-logo" style={{ margin: '0 auto 16px' }}>PM</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Admin access required</div>
          <div style={{ fontSize: 12, color: 'var(--txt3)', marginBottom: 20 }}>Sign in to access the admin dashboard.</div>
          <Link href="/app"><button className="pm-btn pri">Go to Sign In →</button></Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#060912', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="pm-bg" />

      {/* HEADER */}
      <header style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', height: 56, borderBottom: '1px solid var(--div)', background: 'rgba(6,9,18,0.8)', backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="pm-logo" style={{ width: 32, height: 32, fontSize: 11 }}>PM</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)' }}>Admin Dashboard</div>
            <div style={{ fontSize: 10, color: 'var(--txt3)' }}>Company database · {companies.length} companies</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/app"><button className="pm-btn" style={{ fontSize: 11 }}>← Portfolio</button></Link>
          <Link href="/"><button className="pm-btn" style={{ fontSize: 11 }}>Landing Page</button></Link>
        </div>
      </header>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1000, margin: '0 auto', padding: '24px 20px' }}>

        {/* DB NOT READY WARNING */}
        {dbError && (
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 12, color: '#F59E0B', lineHeight: 1.6 }}>
            <strong>Database issue.</strong> {dbError}. Run <code style={{ fontFamily: 'monospace', background: 'rgba(245,158,11,0.12)', padding: '1px 5px', borderRadius: 4 }}>supabase/migrations/001_companies.sql</code> if the `companies` table is missing, then import your real dataset.
          </div>
        )}

        {/* SEARCH */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <input
            className="pm-fi"
            placeholder="Search companies or sectors…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 320 }}
          />
          <button className="pm-btn pri" style={{ fontSize: 11 }} onClick={startCreate}>+ Add Company</button>
          <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</div>
        </div>

        {editing === NEW_COMPANY_ID && (
          <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--indigo)', marginBottom: 12 }}>Add Company</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 140px', gap: 12, marginBottom: 16 }}>
              <div className="pm-fg">
                <div className="pm-fl">Company Name</div>
                <input className="pm-fi" value={draft.name ?? ''} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value, id: d.id || slugifyCompanyId(e.target.value) }))} />
              </div>
              <div className="pm-fg">
                <div className="pm-fl">Ticker</div>
                <input className="pm-fi" value={draft.ticker ?? ''} onChange={(e) => setDraft((d) => ({ ...d, ticker: e.target.value.toUpperCase() }))} />
              </div>
              <div className="pm-fg">
                <div className="pm-fl">ID</div>
                <input className="pm-fi" value={draft.id ?? ''} onChange={(e) => setDraft((d) => ({ ...d, id: slugifyCompanyId(e.target.value) }))} />
              </div>
              <div className="pm-fg">
                <div className="pm-fl">Sector</div>
                <input className="pm-fi" value={draft.sector ?? ''} onChange={(e) => setDraft((d) => ({ ...d, sector: e.target.value }))} />
              </div>
              <div className="pm-fg">
                <div className="pm-fl">Stage</div>
                <select className="pm-fi" value={draft.stage ?? 'Pre-IPO'} onChange={(e) => setDraft((d) => ({ ...d, stage: e.target.value }))}>
                  {['Pre-IPO', 'Series A', 'Series B', 'Series C', 'Series D', 'Series E+', 'Series F', 'Series G', 'Series H', 'Series J', 'IPO Filed'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="pm-fg">
                <div className="pm-fl">Brand Color</div>
                <input className="pm-fi" value={draft.color ?? '#635BFF'} onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))} />
              </div>
              <div className="pm-fg" style={{ gridColumn: '1 / 3' }}>
                <div className="pm-fl">Description</div>
                <input className="pm-fi" value={draft.description ?? ''} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
              </div>
              <div className="pm-fg">
                <div className="pm-fl">Domain</div>
                <input className="pm-fi" value={draft.domain ?? ''} onChange={(e) => setDraft((d) => ({ ...d, domain: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
              <div className="pm-fg">
                <div className="pm-fl">Valuation ($M)</div>
                <input className="pm-fi" type="number" value={draft.currentValuationM ?? 0} onChange={(e) => setDraft((d) => ({ ...d, currentValuationM: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="pm-fg">
                <div className="pm-fl">ARR ($M)</div>
                <input className="pm-fi" type="number" value={draft.arrM ?? 0} onChange={(e) => setDraft((d) => ({ ...d, arrM: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="pm-fg">
                <div className="pm-fl">Last Round Date</div>
                <input className="pm-fi" type="date" value={draft.lastRoundDate ?? new Date().toISOString().slice(0, 10)} onChange={(e) => setDraft((d) => ({ ...d, lastRoundDate: e.target.value }))} />
              </div>
              <div className="pm-fg">
                <div className="pm-fl">Notes (optional)</div>
                <input className="pm-fi" placeholder="e.g. Seeded manually" value={secDraft.notes} onChange={(e) => setSecDraft((d) => ({ ...d, notes: e.target.value }))} />
              </div>
              {(['forge', 'hiive', 'notice'] as const).map((src) => (
                <div key={src} className="pm-fg">
                  <div className="pm-fl">{src.charAt(0).toUpperCase() + src.slice(1)} Price ($)</div>
                  <input className="pm-fi" type="number" step="0.01" value={secDraft[src]} onChange={(e) => setSecDraft((d) => ({ ...d, [src]: e.target.value }))} />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="pm-btn pri" onClick={handleSave} disabled={saving} style={{ fontSize: 11 }}>
                {saving ? 'Saving…' : 'Create Company'}
              </button>
              <button className="pm-btn" onClick={() => setEditing(null)} style={{ fontSize: 11 }}>Cancel</button>
            </div>
          </div>
        )}

        {/* COMPANY TABLE */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--div)', borderRadius: 12, overflow: 'hidden' }}>

          {/* thead */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 90px 90px 60px', gap: 8, padding: '9px 16px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--div)', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--txt3)' }}>
            <span>Company</span><span style={{ textAlign: 'right' }}>Valuation</span><span style={{ textAlign: 'right' }}>ARR</span><span style={{ textAlign: 'right' }}>Blended $</span><span style={{ textAlign: 'right' }}>Updated</span>
          </div>

          {filtered.map((co, idx) => {
            const sec = secondary[co.id] ?? {};
            const prices = [sec.forge ?? co.forgePrice, sec.hiive ?? co.hiivePrice, sec.notice ?? co.noticePrice].sort((a, b) => a - b);
            const blended = prices[1];
            const isEditing = editing === co.id;
            const isLast = idx === filtered.length - 1;

            return (
              <div key={co.id}>
                {/* ROW */}
                <div
                  style={{ display: 'grid', gridTemplateColumns: '1fr 110px 90px 90px 60px', gap: 8, padding: '11px 16px', borderBottom: isEditing || isLast ? 'none' : '1px solid rgba(255,255,255,0.04)', alignItems: 'center', cursor: 'pointer', transition: 'background 0.12s', background: isEditing ? 'rgba(99,102,241,0.05)' : 'transparent' }}
                  onClick={() => isEditing ? setEditing(null) : startEdit(co)}
                  onMouseEnter={(e) => !isEditing && (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                  onMouseLeave={(e) => !isEditing && (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: co.color, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)' }}>{co.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{co.sector} · {co.stage}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--txt)', fontFamily: 'monospace' }}>{fmtVal(co.currentValuationM)}</div>
                  <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--txt2)', fontFamily: 'monospace' }}>{fmtVal(co.arrM)}</div>
                  <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 700, color: co.color, fontFamily: 'monospace' }}>${blended.toFixed(2)}</div>
                  <div style={{ textAlign: 'right', fontSize: 9, color: 'var(--txt3)' }}>{sec.lastUpdated ? timeAgo(sec.lastUpdated) : '—'}</div>
                </div>

                {/* EDIT PANEL */}
                {isEditing && (
                  <div style={{ padding: '16px', background: 'rgba(99,102,241,0.04)', borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>

                      <div className="pm-fg">
                        <div className="pm-fl">Company Name</div>
                        <input className="pm-fi" value={draft.name ?? co.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
                      </div>
                      <div className="pm-fg">
                        <div className="pm-fl">Ticker</div>
                        <input className="pm-fi" value={draft.ticker ?? co.ticker} onChange={(e) => setDraft((d) => ({ ...d, ticker: e.target.value.toUpperCase() }))} />
                      </div>
                      <div className="pm-fg">
                        <div className="pm-fl">Sector</div>
                        <input className="pm-fi" value={draft.sector ?? co.sector} onChange={(e) => setDraft((d) => ({ ...d, sector: e.target.value }))} />
                      </div>
                      <div className="pm-fg">
                        <div className="pm-fl">Valuation ($M)</div>
                        <input className="pm-fi" type="number" value={draft.currentValuationM ?? co.currentValuationM} onChange={(e) => setDraft((d) => ({ ...d, currentValuationM: parseFloat(e.target.value) }))} />
                      </div>
                      <div className="pm-fg">
                        <div className="pm-fl">Brand Color</div>
                        <input className="pm-fi" value={draft.color ?? co.color} onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))} />
                      </div>
                      <div className="pm-fg">
                        <div className="pm-fl">ARR ($M)</div>
                        <input className="pm-fi" type="number" value={draft.arrM ?? co.arrM} onChange={(e) => setDraft((d) => ({ ...d, arrM: parseFloat(e.target.value) }))} />
                      </div>
                      <div className="pm-fg">
                        <div className="pm-fl">Last Round Date</div>
                        <input className="pm-fi" type="date" value={draft.lastRoundDate ?? co.lastRoundDate} onChange={(e) => setDraft((d) => ({ ...d, lastRoundDate: e.target.value }))} />
                      </div>
                      <div className="pm-fg">
                        <div className="pm-fl">Stage</div>
                        <select className="pm-fi" value={draft.stage ?? co.stage} onChange={(e) => setDraft((d) => ({ ...d, stage: e.target.value }))}>
                          {['Pre-IPO', 'Series A', 'Series B', 'Series C', 'Series D', 'Series E+', 'Series F', 'Series G', 'Series H', 'Series J', 'IPO Filed'].map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div className="pm-fg" style={{ gridColumn: '2 / -1' }}>
                        <div className="pm-fl">Description</div>
                        <input className="pm-fi" value={draft.description ?? co.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
                      </div>
                      <div className="pm-fg">
                        <div className="pm-fl">Domain</div>
                        <input className="pm-fi" value={draft.domain ?? co.domain} onChange={(e) => setDraft((d) => ({ ...d, domain: e.target.value }))} />
                      </div>
                    </div>

                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--txt3)', marginBottom: 10 }}>Secondary Market Prices</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                      {(['forge', 'hiive', 'notice'] as const).map((src) => (
                        <div key={src} className="pm-fg">
                          <div className="pm-fl">{src.charAt(0).toUpperCase() + src.slice(1)} Price ($)</div>
                          <input className="pm-fi" type="number" step="0.01" value={secDraft[src]} onChange={(e) => setSecDraft((d) => ({ ...d, [src]: e.target.value }))} />
                        </div>
                      ))}
                      <div className="pm-fg">
                        <div className="pm-fl">Notes (optional)</div>
                        <input className="pm-fi" placeholder="e.g. Q2 trade" value={secDraft.notes} onChange={(e) => setSecDraft((d) => ({ ...d, notes: e.target.value }))} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="pm-btn pri" onClick={handleSave} disabled={saving} style={{ fontSize: 11 }}>
                        {saving ? 'Saving…' : 'Save Changes'}
                      </button>
                      <button className="pm-btn" onClick={() => setEditing(null)} style={{ fontSize: 11 }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 12, fontSize: 10, color: 'var(--txt3)', textAlign: 'center' }}>
          Click any row to edit. Secondary price changes are stored with a timestamp — the app shows the most recent value per source.
        </div>
      </div>

      {/* TOAST */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: toast.ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${toast.ok ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`, color: toast.ok ? 'var(--green)' : 'var(--red)', padding: '10px 18px', borderRadius: 10, fontSize: 12, fontWeight: 600, zIndex: 500, backdropFilter: 'blur(10px)' }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
