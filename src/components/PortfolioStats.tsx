"use client";

import PnlBadge from "./PnlBadge";
import type { PortfolioStats } from "@/types";

export default function PortfolioStatsPanel({ stats }: { stats: PortfolioStats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard label="Total P&L" value={<PnlBadge value={stats.total_pnl} />} />
      <StatCard label="Unrealized" value={<PnlBadge value={stats.unrealized_pnl} />} />
      <StatCard label="Realized" value={<PnlBadge value={stats.realized_pnl} />} />
      <StatCard
        label="Win Rate"
        value={
          <span className={`font-mono font-semibold ${stats.win_rate >= 0.51 ? "text-emerald-400" : "text-red-400"}`}>
            {stats.closed_positions > 0 ? `${(stats.win_rate * 100).toFixed(0)}%` : "—"}
          </span>
        }
        sub={stats.closed_positions > 0 ? `${stats.closed_positions} closed` : "No closed trades"}
      />
      <StatCard
        label="Invested"
        value={<span className="text-white font-mono font-semibold">${stats.total_invested.toFixed(2)}</span>}
      />
      <StatCard
        label="Current Value"
        value={<span className="text-white font-mono font-semibold">${stats.current_value.toFixed(2)}</span>}
      />
      <StatCard
        label="Open Positions"
        value={<span className="text-blue-400 font-mono font-semibold">{stats.open_positions}</span>}
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
    <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-4">
      <p className="text-xs text-slate-400 mb-1.5">{label}</p>
      <div className="text-lg">{value}</div>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}
