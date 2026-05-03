'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';
import { Company, COMPANIES } from '@/lib/companies';
import { fetchCompanies, saveCompany, addSecondaryPrice, fetchSecondaryPrices } from '@/lib/companies-db';

type SecondaryMap = Record<string, { forge?: number; hiive?: number; notice?: number; lastUpdated?: string }>;

function fmtVal(m: number | null) {
  if (m === null) return 'N/A';
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
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [companies, setCompanies] = useState<Company[]>(COMPANIES);
  const [secondary, setSecondary] = useState<SecondaryMap>({});
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Company>>({});
  const [secDraft, setSecDraft] = useState<{ forge: string; hiive: string; notice: string; notes: string }>({ forge: '', hiive: '', notice: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [dbReady, setDbReady] = useState(true);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  /* check auth */
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) { setAuthed(false); return; }
    sb.auth.getSession().then(({ data }) => setAuthed(!!data.session?.user));
    const { data: { subscription } } = sb.auth.onAuthStateChange((_ev, s) => setAuthed(!!s?.user));
    return () => subscription.unsubscribe();
  }, []);

  /* load data */
  useEffect(() => {
    if (!authed) return;
    fetchCompanies().then(({ companies: rows }) => {
      if (rows === COMPANIES) setDbReady(false);
      else setCompanies(rows);
    });
    fetchSecondaryPrices().then(setSecondary);
  }, [authed]);

  const startEdit = (co: Company) => {
    setEditing(co.id);
    setDraft({ ...co });
    const sec = secondary[co.id] ?? {};
    setSecDraft({
      forge: String(sec.forge ?? co.forgePrice ?? ''),
      hiive: String(sec.hiive ?? co.hiivePrice ?? ''),
      notice: String(sec.notice ?? co.noticePrice ?? ''),
      notes: '',
    });
  };

  const handleSave = async () => {
    if (!editing || !draft) return;
    setSaving(true);
    const updated: Company = { ...companies.find(c => c.id === editing)!, ...draft } as Company;

    const err = await saveCompany(updated);
    if (err) { showToast(err, false); setSaving(false); return; }

    /* save secondary prices if changed */
    const orig = secondary[editing] ?? {};
    const sources: Array<'forge' | 'hiive' | 'notice'> = ['forge', 'hiive', 'notice'];
    for (const src of sources) {
      const val = parseFloat(secDraft[src]);
      if (!isNaN(val) && val !== orig[src]) {
        await addSecondaryPrice(editing, src, val, secDraft.notes);
      }
    }

    setCompanies((prev) => prev.map((c) => (c.id === editing ? updated : c)));
    setSecondary((prev) => ({
      ...prev,
      [editing]: {
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

  const handleSyncForge = async () => {
    const sb = getSupabase();
    if (!sb) { showToast('Supabase not connected', false); return; }
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { showToast('Not signed in', false); return; }
    setSyncing(true);
    try {
      const res = await fetch('/api/scrape-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok) { showToast(json.error ?? 'Sync failed', false); return; }
      const count = json.saved?.length ?? 0;
      showToast(count > 0 ? `Saved ${count} Forge price${count !== 1 ? 's' : ''}` : 'No prices found — selectors may need updating');
      if (count > 0) fetchSecondaryPrices().then(setSecondary);
    } catch (e) {
      showToast(String(e), false);
    } finally {
      setSyncing(false);
    }
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
          <button className="pm-btn" style={{ fontSize: 11 }} onClick={handleSyncForge} disabled={syncing || !dbReady}>
            {syncing ? 'Syncing…' : '⟳ Sync Forge Prices'}
          </button>
          <Link href="/app"><button className="pm-btn" style={{ fontSize: 11 }}>← Portfolio</button></Link>
          <Link href="/"><button className="pm-btn" style={{ fontSize: 11 }}>Landing Page</button></Link>
        </div>
      </header>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1000, margin: '0 auto', padding: '24px 20px' }}>

        {/* DB NOT READY WARNING */}
        {!dbReady && (
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 12, color: '#F59E0B', lineHeight: 1.6 }}>
            <strong>Database not set up yet.</strong> Run <code style={{ fontFamily: 'monospace', background: 'rgba(245,158,11,0.12)', padding: '1px 5px', borderRadius: 4 }}>supabase/migrations/001_companies.sql</code> in your Supabase SQL editor to create the companies table and seed it.
            Showing hardcoded data — changes won't be saved until the DB is ready.
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
          <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</div>
        </div>

        {/* COMPANY TABLE */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--div)', borderRadius: 12, overflow: 'hidden' }}>

          {/* thead */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 90px 90px 60px', gap: 8, padding: '9px 16px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--div)', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--txt3)' }}>
            <span>Company</span><span style={{ textAlign: 'right' }}>Valuation</span><span style={{ textAlign: 'right' }}>ARR</span><span style={{ textAlign: 'right' }}>Blended $</span><span style={{ textAlign: 'right' }}>Updated</span>
          </div>

          {filtered.map((co, idx) => {
            const sec = secondary[co.id] ?? {};
            const rawPrices = [sec.forge ?? co.forgePrice, sec.hiive ?? co.hiivePrice, sec.notice ?? co.noticePrice].filter((v): v is number => v !== null);
            const blended = rawPrices.length ? rawPrices.sort((a, b) => a - b)[Math.floor(rawPrices.length / 2)] : null;
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
                  <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 700, color: blended !== null ? co.color : 'var(--txt3)', fontFamily: 'monospace' }}>{blended !== null ? `$${blended.toFixed(2)}` : 'N/A'}</div>
                  <div style={{ textAlign: 'right', fontSize: 9, color: 'var(--txt3)' }}>{sec.lastUpdated ? timeAgo(sec.lastUpdated) : '—'}</div>
                </div>

                {/* EDIT PANEL */}
                {isEditing && (
                  <div style={{ padding: '16px', background: 'rgba(99,102,241,0.04)', borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>

                      <div className="pm-fg">
                        <div className="pm-fl">Valuation ($M)</div>
                        <input className="pm-fi" type="number" value={draft.currentValuationM ?? co.currentValuationM} onChange={(e) => setDraft((d) => ({ ...d, currentValuationM: parseFloat(e.target.value) }))} />
                      </div>
                      <div className="pm-fg">
                        <div className="pm-fl">ARR ($M)</div>
                        <input className="pm-fi" type="number" placeholder="N/A" value={draft.arrM ?? co.arrM ?? ''} onChange={(e) => setDraft((d) => ({ ...d, arrM: e.target.value === '' ? null : parseFloat(e.target.value) }))} />
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
