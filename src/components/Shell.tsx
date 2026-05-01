'use client';

import { useState, useEffect, useMemo } from 'react';
import { StoredPosition, DerivedPosition, derivePosition, loadPositions, savePositions, DEMO_POSITIONS } from '@/lib/positions';
import SummaryStrip from './SummaryStrip';
import PositionsTable from './PositionsTable';
import CardsView from './CardsView';
import SidePanel from './SidePanel';
import AddPositionModal from './AddPositionModal';
import IntelligencePanel from './IntelligencePanel';

const NAV = [
  { icon: '⊞', label: 'Overview' },
  { icon: '◈', label: 'Companies' },
  { icon: '◎', label: 'Portfolio', on: true },
  { icon: '✎', label: 'Notes', badge: true },
  { icon: '◉', label: 'Intelligence' },
];

type View = 'table' | 'cards' | 'intelligence';
interface SortState { key: string; dir: number; }

export default function Shell() {
  const [positions, setPositions] = useState<StoredPosition[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [view, setView] = useState<View>('table');
  const [sort, setSort] = useState<SortState>({ key: 'currentValue', dir: -1 });
  const [modal, setModal] = useState<{ open: boolean; editing: StoredPosition | null }>({ open: false, editing: null });
  const [tick, setTick] = useState(new Date());

  useEffect(() => {
    const stored = loadPositions();
    setPositions(stored.length ? stored : DEMO_POSITIONS);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTick(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

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
  const totalPLpct = (totalPL / totalCost) * 100;
  const avgMultiple = totalCurr / totalCost;
  const gainers = derived.filter((p) => p.unrealizedPL > 0).length;

  const handleSort = (key: string) => setSort((s) => ({ key, dir: s.key === key ? s.dir * -1 : -1 }));
  const handleExpand = (id: string) => setExpanded((e) => (e === id ? null : id));

  const handleSave = (pos: StoredPosition) => {
    const next = modal.editing
      ? positions.map((p) => (p.id === pos.id ? pos : p))
      : [...positions, pos];
    setPositions(next);
    savePositions(next);
  };

  const handleRemove = (id: string) => {
    const next = positions.filter((p) => p.id !== id);
    setPositions(next);
    savePositions(next);
    setExpanded(null);
  };

  const ts = tick.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const dateStr = tick.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const companyIds = [...new Set(derived.map((p) => p.companyId))];

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
            <div className="pm-ri"><span style={{ fontSize: 13 }}>⚙</span><div className="pm-tip">Settings</div></div>
            <div className="pm-sep" />
            <div className="pm-av">A</div>
          </div>
        </aside>

        {/* TOPBAR */}
        <header className="pm-topbar">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <div className="pm-tb-title">Portfolio Terminal</div>
            <div className="pm-tb-sub">{dateStr} · {ts}</div>
          </div>
          <div className="pm-tb-div" />
          <div className="pm-vtabs">
            {([['table', 'Table'], ['cards', 'Cards'], ['intelligence', 'Intelligence']] as [View, string][]).map(([k, l]) => (
              <div key={k} className={`pm-vtab ${view === k ? 'on' : ''}`} onClick={() => setView(k)}>{l}</div>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
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
