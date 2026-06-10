'use client';

import { useState, useEffect, useMemo } from 'react';
import { StoredPosition, DerivedPosition, derivePosition, loadPositions, savePositions } from '@/lib/positions';
import { COMPANIES } from '@/lib/companies';
import SummaryStrip from './SummaryStrip';
import PositionsTable from './PositionsTable';
import CardsView from './CardsView';
import SidePanel from './SidePanel';
import AddPositionModal from './AddPositionModal';
import IntelligencePanel from './IntelligencePanel';
import ChartsView from './ChartsView';

type View = 'table' | 'cards' | 'charts' | 'intelligence';
interface SortState { key: string; dir: number; }

export default function Shell() {
  const [positions, setPositions] = useState<StoredPosition[]>([]);
  const [ready, setReady] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [view, setView] = useState<View>('table');
  const [sort, setSort] = useState<SortState>({ key: 'currentValue', dir: -1 });
  const [modal, setModal] = useState<{ open: boolean; editing: StoredPosition | null }>({ open: false, editing: null });
  const [tick, setTick] = useState(new Date());

  /* load from localStorage on mount */
  useEffect(() => {
    setPositions(loadPositions());
    setReady(true);
  }, []);

  /* clock */
  useEffect(() => {
    const t = setInterval(() => setTick(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const rawTotalCurr = positions.reduce((s, p) => {
    const liveVal = COMPANIES.find((c) => c.id === p.companyId)?.currentValuationM ?? p.currentValuationM;
    const curr = (liveVal / p.entryValuationM) * p.entrySharePrice;
    return s + p.shares * curr;
  }, 0);

  const derived: DerivedPosition[] = useMemo(() => {
    const all = positions.map((p) => derivePosition(p, rawTotalCurr, COMPANIES));
    return all.sort((a, b) => {
      const av = a[sort.key as keyof DerivedPosition] as number;
      const bv = b[sort.key as keyof DerivedPosition] as number;
      return (bv - av) * sort.dir;
    });
  }, [positions, sort, rawTotalCurr]);

  const totalCost = derived.reduce((s, p) => s + p.costBasis, 0);
  const totalCurr = derived.reduce((s, p) => s + p.currentValue, 0);
  const totalSec  = derived.reduce((s, p) => s + p.secondaryValue, 0);
  const totalPL   = totalCurr - totalCost;
  const totalPLpct = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;
  const avgMultiple = totalCost > 0 ? totalCurr / totalCost : 1;
  const gainers = derived.filter((p) => p.unrealizedPL > 0).length;
  const companyIds = [...new Set(derived.map((p) => p.companyId))];

  const handleSort   = (key: string) => setSort((s) => ({ key, dir: s.key === key ? s.dir * -1 : -1 }));
  const handleExpand = (id: string)  => setExpanded((e) => (e === id ? null : id));

  const persist = (next: StoredPosition[]) => {
    setPositions(next);
    savePositions(next);
  };

  const handleSave = (pos: StoredPosition) => {
    persist(modal.editing
      ? positions.map((p) => (p.id === pos.id ? pos : p))
      : [...positions, pos]);
  };

  const handleRemove = (id: string) => {
    persist(positions.filter((p) => p.id !== id));
    setExpanded(null);
  };

  const handleExportCSV = () => {
    if (!derived.length) return;
    const headers = ['Company','Ticker','Sector','Shares','Entry Price ($)','Entry Valuation ($M)','Cost Basis ($)','Current Value ($)','Secondary Value ($)','Unrealized P&L ($)','Return (%)','MOIC','IRR (%)','Allocation (%)','Days Held','Entry Date','Notes'];
    const rows = derived.map((p) => [
      p.name, p.ticker, p.sector, p.shares,
      p.entrySharePrice.toFixed(2), p.entryValuationM,
      p.costBasis.toFixed(2), p.currentValue.toFixed(2), p.secondaryValue.toFixed(2),
      p.unrealizedPL.toFixed(2), p.unrealizedPct.toFixed(2), p.multiple.toFixed(4),
      p.annualizedRet.toFixed(2), p.allocation.toFixed(2), p.days, p.entryDate,
      `"${(p.notes ?? '').replace(/"/g, '""')}"`,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: `pm-terminal-${new Date().toISOString().slice(0,10)}.csv` });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(positions, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: `pm-terminal-backup-${new Date().toISOString().slice(0,10)}.json` });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = () => {
    const input = Object.assign(document.createElement('input'), { type: 'file', accept: '.json' });
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (Array.isArray(data)) persist(data);
        } catch { /* bad file */ }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const ts      = tick.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const dateStr = tick.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  if (!ready) {
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
          {[
            { icon: '◎', label: 'Portfolio' },
            { icon: '◉', label: 'Intelligence' },
            { icon: '⊞', label: 'Charts' },
          ].map((item) => (
            <div key={item.label} className="pm-ri">
              {item.icon}
              <div className="pm-tip">{item.label}</div>
            </div>
          ))}
          <div className="pm-rail-foot">
            <div className="pm-sep" />
            <div className="pm-ri" onClick={handleExportJSON} title="Backup">
              <span style={{ fontSize: 13 }}>↓</span>
              <div className="pm-tip">Backup JSON</div>
            </div>
            <div className="pm-ri" onClick={handleImportJSON} title="Restore">
              <span style={{ fontSize: 13 }}>↑</span>
              <div className="pm-tip">Restore JSON</div>
            </div>
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
            {(['table','cards','charts','intelligence'] as View[]).map((k) => (
              <div key={k} className={`pm-vtab ${view === k ? 'on' : ''}`} onClick={() => setView(k)}>
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </div>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {derived.length > 0 && <button className="pm-btn" onClick={handleExportCSV}>Export CSV</button>}
            <button className="pm-btn pri" onClick={() => setModal({ open: true, editing: null })}>+ Add Position</button>
          </div>
        </header>

        {/* MAIN */}
        <main className="pm-main">
          {derived.length > 0 && (
            <SummaryStrip
              totalCost={totalCost} totalCurr={totalCurr} totalSec={totalSec}
              totalPL={totalPL} totalPLpct={totalPLpct} avgMultiple={avgMultiple}
              gainers={gainers} total={derived.length}
            />
          )}
          {view === 'table' && (
            <PositionsTable
              positions={derived} expanded={expanded} sort={sort}
              onExpand={handleExpand} onSort={handleSort}
              onRemove={handleRemove}
              onEdit={(pos) => setModal({ open: true, editing: pos })}
              onAdd={() => setModal({ open: true, editing: null })}
            />
          )}
          {view === 'cards'        && <CardsView positions={derived} onAdd={() => setModal({ open: true, editing: null })} />}
          {view === 'charts'       && <ChartsView positions={derived} />}
          {view === 'intelligence' && <IntelligencePanel companyIds={companyIds} />}
        </main>

        <SidePanel
          positions={derived} totalCost={totalCost} totalCurr={totalCurr} totalSec={totalSec}
          totalPL={totalPL} totalPLpct={totalPLpct} avgMultiple={avgMultiple} gainers={gainers}
        />
      </div>

      {modal.open && (
        <AddPositionModal
          initial={modal.editing}
          companies={COMPANIES}
          onClose={() => setModal({ open: false, editing: null })}
          onSave={handleSave}
        />
      )}
    </>
  );
}
