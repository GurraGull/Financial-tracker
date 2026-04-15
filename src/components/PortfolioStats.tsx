"use client";

import PnlBadge from "./PnlBadge";
import type { PortfolioStats } from "@/types";

export default function PortfolioStatsPanel({ stats, isReal }: { stats: PortfolioStats; isReal?: boolean }) {
  const accent = isReal ? "text-amber-400" : "text-blue-400";
  const borderAccent = isReal ? "border-amber-700/20 bg-amber-950/10" : "border-slate-700/50 bg-slate-900";

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl border ${borderAccent}`}>
      <StatCard label="Total P&L" value={<PnlBadge value={stats.total_pnl} />} />
      <StatCard
        label="ROI"
        value={
          <span className={`font-mono font-semibold ${stats.roi_pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {stats.roi_pct >= 0 ? "+" : ""}{stats.roi_pct.toFixed(1)}%
          </span>
        }
        sub={`on $${stats.starting_balance.toFixed(0)} bankroll`}
      />
      <StatCard label="Unrealized" value={<PnlBadge value={stats.unrealized_pnl} />} />
      <StatCard label="Realized" value={<PnlBadge value={stats.realized_pnl} />} />
      <StatCard
        label="Win Rate"
        value={
          <span className={`font-mono font-semibold ${stats.win_rate >= 0.51 ? "text-emerald-400" : stats.closed_positions > 0 ? "text-red-400" : "text-slate-400"}`}>
            {stats.closed_positions > 0 ? `${(stats.win_rate * 100).toFixed(0)}%` : "—"}
          </span>
        }
        sub={stats.closed_positions > 0 ? `${stats.closed_positions} closed` : "No closed trades yet"}
      />
      <StatCard
        label="Cash Available"
        value={
          <span className={`font-mono font-semibold ${stats.cash_available < stats.starting_balance * 0.1 ? "text-red-400" : "text-emerald-400"}`}>
            ${stats.cash_available.toFixed(2)}
          </span>
        }
      />
      <StatCard
        label="Open Positions"
        value={<span className={`font-mono font-semibold ${accent}`}>{stats.open_positions}</span>}
      />
      <StatCard
        label="Total Trades"
        value={<span className="text-slate-300 font-mono font-semibold">{stats.total_trades}</span>}
      />
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <div className="text-base">{value}</div>
      {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}
