'use client';

import { useState, useEffect, useMemo } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';
import { dbLoad, dbUpsert, dbDelete } from '@/lib/db';
import { StoredPosition, DerivedPosition, derivePosition, loadPositions, savePositions, DEMO_POSITIONS } from '@/lib/positions';
import { Company, COMPANIES } from '@/lib/companies';
import { fetchCompanies } from '@/lib/companies-db';
import SummaryStrip from './SummaryStrip';
import PositionsTable from './PositionsTable';
import CardsView from './CardsView';
import SidePanel from './SidePanel';
import AddPositionModal from './AddPositionModal';
import IntelligencePanel from './IntelligencePanel';
import AuthModal from './AuthModal';

const NAV = [
  { icon: '⊞', label: 'Overview' },
  { icon: '◈', label: 'Companies' },
  { icon: '◎', label: 'Portfolio', on: true },
  { icon: '✎', label: 'Notes', badge: true },
  { icon: '◉', label: 'Intelligence' },
];

type View = 'table' | 'cards' | 'intelligence';
interface SortState { key: string; dir: number; }

const hasSupabase = () => !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function setDemo(set: (v: StoredPosition[]) => void, setIs: (v: boolean) => void, rows: StoredPosition[]) {
  if (rows.length) { set(rows); setIs(false); } else { set(DEMO_POSITIONS); setIs(true); }
}

export default function Shell() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [positions, setPositions] = useState<StoredPosition[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [demoDismissed, setDemoDismissed] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [view, setView] = useState<View>('table');
  const [sort, setSort] = useState<SortState>({ key: 'currentValue', dir: -1 });
  const [modal, setModal] = useState<{ open: boolean; editing: StoredPosition | null }>({ open: false, editing: null });
  const [tick, setTick] = useState(new Date());
  const [companies, setCompanies] = useState<Company[]>(COMPANIES);

  /* fetch live company data from DB (falls back to hardcoded on error) */
  useEffect(() => {
    fetchCompanies().then(({ companies: rows }) => { if (rows.length) setCompanies(rows); });
  }, []);

  /* auth bootstrap */
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setAuthChecked(true);
      setDemo(setPositions, setIsDemo, loadPositions());
      return;
    }
    sb.auth.getSession().then(({ data, error }) => {
      if (error) {
        setAuthChecked(true);
        setDemo(setPositions, setIsDemo, loadPositions());
        return;
      }
      const u = data.session?.user ?? null;
      setUser(u);
      setAuthChecked(true);
      if (!u) setShowAuth(true);
    }).catch(() => {
      setAuthChecked(true);
      setDemo(setPositions, setIsDemo, loadPositions());
    });
    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const { data } = sb.auth.onAuthStateChange((_ev, session) => {
        const u = session?.user ?? null;
        setUser(u);
        if (!u) { setShowAuth(true); setPositions([]); }
      });
      subscription = data.subscription;
    } catch { /* ignore */ }
    return () => subscription?.unsubscribe();
  }, []);

  /* load positions when user known */
  useEffect(() => {
    if (!authChecked) return;
    if (user) {
      dbLoad(user.id).then((rows) => setDemo(setPositions, setIsDemo, rows));
    } else if (!getSupabase()) {
      setDemo(setPositions, setIsDemo, loadPositions());
    }
  }, [user, authChecked]);

  /* clock */
  useEffect(() => { const t = setInterval(() => setTick(new Date()), 1000); return () => clearInterval(t); }, []);

  const rawTotalCurr = positions.reduce((s, p) => {
    const curr = (p.currentValuationM / p.entryValuationM) * p.entrySharePrice;
    return s + p.shares * curr;
  }, 0);

  const derived: DerivedPosition[] = useMemo(() => {
    const all = positions.map((p) => derivePosition(p, rawTotalCurr, companies));
    return all.sort((a, b) => {
      const av = a[sort.key as keyof DerivedPosition] as number;
      const bv = b[sort.key as keyof DerivedPosition] as number;
      return (bv - av) * sort.dir;
    });
  }, [positions, sort, rawTotalCurr, companies]);

  const totalCost = derived.reduce((s, p) => s + p.costBasis, 0);
  const totalCurr = derived.reduce((s, p) => s + p.currentValue, 0);
  const totalSec = derived.reduce((s, p) => s + p.secondaryValue, 0);
  const totalPL = totalCurr - totalCost;
  const totalPLpct = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;
  const avgMultiple = totalCost > 0 ? totalCurr / totalCost : 1;
  const gainers = derived.filter((p) => p.unrealizedPL > 0).length;

  const handleSort = (key: string) => setSort((s) => ({ key, dir: s.key === key ? s.dir * -1 : -1 }));
  const handleExpand = (id: string) => setExpanded((e) => (e === id ? null : id));

  const handleSave = async (pos: StoredPosition) => {
    const next = modal.editing
      ? positions.map((p) => (p.id === pos.id ? pos : p))
      : [...positions, pos];
    setPositions(next);
    setIsDemo(false);
    if (user) { await dbUpsert(user.id, pos); }
    else { savePositions(next); }
  };

  const handleRemove = async (id: string) => {
    const next = positions.filter((p) => p.id !== id);
    setPositions(next);
    setExpanded(null);
    if (user) { await dbDelete(user.id, id); }
    else { savePositions(next); }
  };

  const handleSignOut = async () => {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    setUser(null);
    setPositions([]);
    setShowAuth(true);
  };

  const handleExportCSV = () => {
    const headers = ['Company', 'Ticker', 'Sector', 'Shares', 'Entry Price ($)', 'Entry Valuation ($M)', 'Cost Basis ($)', 'Current Value ($)', 'Secondary Value ($)', 'Unrealized P&L ($)', 'Return (%)', 'MOIC', 'Annualized IRR (%)', 'Allocation (%)', 'Days Held', 'Entry Date', 'Notes'];
    const rows = derived.map((p) => [
      p.name, p.ticker, p.sector,
      p.shares, p.entrySharePrice.toFixed(2), p.entryValuationM,
      p.costBasis.toFixed(2), p.currentValue.toFixed(2), p.secondaryValue.toFixed(2),
      p.unrealizedPL.toFixed(2), p.unrealizedPct.toFixed(2), p.multiple.toFixed(4),
      p.annualizedRet.toFixed(2), p.allocation.toFixed(2), p.days, p.entryDate,
      `"${(p.notes ?? '').replace(/"/g, '""')}"`,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pm-terminal-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const ts = tick.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const dateStr = tick.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const companyIds = [...new Set(derived.map((p) => p.companyId))];
  const userInitial = user?.email?.[0]?.toUpperCase() ?? 'A';
  const showDemoBanner = isDemo && !demoDismissed;

  if (!authChecked) {
    return (
      <>
        <div className="pm-bg" />
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div className="pm-logo" style={{ width: 44, height: 44, fontSize: 15 }}>PM</div>
            <div style={{ fontSize: 11, color: 'var(--txt3)', letterSpacing: '0.05em' }}>Loading…</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="pm-bg" />
      <div className="pm-shell">
        {/* RAIL */}
        <aside className="pm-rail">
          <div className="pm-logo">PM</div>
          <div className="pm-sep" />
          {NAV.map((item) => (
            <div key={item.label} className={`pm-ri ${item.on ? 'on' : ''}`}>
              {item.icon}
              {item.badge && <div className="pm-rb" />}
              <div className="pm-tip">{item.label}</div>
            </div>
          ))}
          <div className="pm-rail-foot">
            <div className="pm-sep" />
            <div className="pm-ri" onClick={handleSignOut} title="Sign Out">
              <span style={{ fontSize: 13 }}>⎋</span>
              <div className="pm-tip">Sign Out</div>
            </div>
            <div className="pm-sep" />
            <div className="pm-av" title={user?.email}>{userInitial}</div>
          </div>
        </aside>

        {/* TOPBAR */}
        <header className="pm-topbar">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <div className="pm-tb-title">Portfolio Terminal</div>
            <div className="pm-tb-sub">{dateStr} · {ts}{user ? ` · ${user.email}` : ''}</div>
          </div>
          <div className="pm-tb-div" />
          <div className="pm-vtabs">
            {([['table', 'Table'], ['cards', 'Cards'], ['intelligence', 'Intelligence']] as [View, string][]).map(([k, l]) => (
              <div key={k} className={`pm-vtab ${view === k ? 'on' : ''}`} onClick={() => setView(k)}>{l}</div>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {!user && !hasSupabase() && <span style={{ fontSize: 9, color: 'var(--txt3)', padding: '4px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: 6, border: '1px solid var(--div)' }}>localStorage mode</span>}
            <button className="pm-btn" onClick={handleExportCSV}>Export CSV</button>
            <button className="pm-btn pri" onClick={() => setModal({ open: true, editing: null })}>+ Add Position</button>
          </div>
        </header>

        {/* MAIN */}
        <main className="pm-main">
          {showDemoBanner && (
            <div className="pm-demo-banner">
              <span>⚡ Demo mode — these are sample positions. Add your own to get started.</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="pm-btn pri" style={{ padding: '4px 12px', fontSize: 10 }} onClick={() => setModal({ open: true, editing: null })}>+ Add Position</button>
                <button className="pm-btn" style={{ padding: '4px 10px', fontSize: 10 }} onClick={() => setDemoDismissed(true)}>✕</button>
              </div>
            </div>
          )}
          <SummaryStrip
            totalCost={totalCost} totalCurr={totalCurr} totalSec={totalSec}
            totalPL={totalPL} totalPLpct={totalPLpct} avgMultiple={avgMultiple}
            gainers={gainers} total={derived.length}
          />
          {view === 'table' && (
            <PositionsTable
              positions={derived} expanded={expanded} sort={sort}
              onExpand={handleExpand} onSort={handleSort}
              onRemove={handleRemove}
              onEdit={(pos) => setModal({ open: true, editing: pos })}
            />
          )}
          {view === 'cards' && <CardsView positions={derived} />}
          {view === 'intelligence' && <IntelligencePanel companyIds={companyIds} />}

          {/* Mobile-only inline stats (replaces hidden side panel) */}
          <div style={{ display: 'none' }} className="pm-mobile-stats">
            <SidePanel
              positions={derived} totalCost={totalCost} totalCurr={totalCurr} totalSec={totalSec}
              totalPL={totalPL} totalPLpct={totalPLpct} avgMultiple={avgMultiple} gainers={gainers}
            />
          </div>
        </main>

        {/* SIDE PANEL — desktop only */}
        <SidePanel
          positions={derived} totalCost={totalCost} totalCurr={totalCurr} totalSec={totalSec}
          totalPL={totalPL} totalPLpct={totalPLpct} avgMultiple={avgMultiple} gainers={gainers}
        />
      </div>

      {showAuth && !user && (
        <AuthModal onAuthed={() => {
          setShowAuth(false);
          getSupabase()?.auth.getSession().then(({ data }) => {
            if (data.session?.user) setUser(data.session.user);
          });
        }} />
      )}

      {modal.open && (
        <AddPositionModal
          initial={modal.editing}
          onClose={() => setModal({ open: false, editing: null })}
          onSave={handleSave}
        />
      )}
    </>
  );
}
