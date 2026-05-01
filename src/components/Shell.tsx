'use client';

import { useState, useEffect, useMemo } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';
import { dbLoad, dbUpsert, dbDelete } from '@/lib/db';
import { StoredPosition, DerivedPosition, derivePosition, loadPositions, savePositions, DEMO_POSITIONS } from '@/lib/positions';
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

export default function Shell() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [positions, setPositions] = useState<StoredPosition[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [view, setView] = useState<View>('table');
  const [sort, setSort] = useState<SortState>({ key: 'currentValue', dir: -1 });
  const [modal, setModal] = useState<{ open: boolean; editing: StoredPosition | null }>({ open: false, editing: null });
  const [tick, setTick] = useState(new Date());

  /* auth bootstrap */
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setAuthChecked(true);
      const stored = loadPositions();
      setPositions(stored.length ? stored : DEMO_POSITIONS);
      return;
    }
    sb.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u);
      setAuthChecked(true);
      if (!u) setShowAuth(true);
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((_ev, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (!u) { setShowAuth(true); setPositions([]); }
    });
    return () => subscription.unsubscribe();
  }, []);

  /* load positions when user known */
  useEffect(() => {
    if (!authChecked) return;
    if (user) {
      dbLoad(user.id).then((rows) => setPositions(rows.length ? rows : DEMO_POSITIONS));
    } else if (!getSupabase()) {
      const stored = loadPositions();
      setPositions(stored.length ? stored : DEMO_POSITIONS);
    }
  }, [user, authChecked]);

  /* clock */
  useEffect(() => { const t = setInterval(() => setTick(new Date()), 1000); return () => clearInterval(t); }, []);

  const rawTotalCurr = positions.reduce((s, p) => {
    const curr = (p.currentValuationM / p.entryValuationM) * p.entrySharePrice;
    return s + p.shares * curr;
  }, 0);

  const derived: DerivedPosition[] = useMemo(() => {
    const all = positions.map((p) => derivePosition(p, rawTotalCurr));
    return all.sort((a, b) => {
      const av = a[sort.key as keyof DerivedPosition] as number;
      const bv = b[sort.key as keyof DerivedPosition] as number;
      return (bv - av) * sort.dir;
    });
  }, [positions, sort, rawTotalCurr]);

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

  const ts = tick.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const dateStr = tick.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const companyIds = [...new Set(derived.map((p) => p.companyId))];
  const userInitial = user?.email?.[0]?.toUpperCase() ?? 'A';

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
            <button className="pm-btn">Export CSV</button>
            <button className="pm-btn pri" onClick={() => setModal({ open: true, editing: null })}>+ Add Position</button>
          </div>
        </header>

        {/* MAIN */}
        <main className="pm-main">
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
        </main>

        {/* SIDE PANEL */}
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
