"use client";

import { useState } from "react";
import PnlBadge from "./PnlBadge";
import EdgeBadge from "./EdgeBadge";
import type { PaperTrade } from "@/types";

interface TradesTableProps {
  trades: PaperTrade[];
  onRefresh: () => void;
}

export default function TradesTable({ trades, onRefresh }: TradesTableProps) {
  const [closing, setClosing] = useState<number | null>(null);

  async function closeTrade(id: number) {
    setClosing(id);
    try {
      await fetch(`/api/trades/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "close" }),
      });
      onRefresh();
    } finally {
      setClosing(null);
    }
  }

  async function deleteTrade(id: number) {
    if (!confirm("Delete this trade?")) return;
    await fetch(`/api/trades/${id}`, { method: "DELETE" });
    onRefresh();
  }

  if (trades.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="text-4xl mb-3">📊</p>
        <p>No trades yet — browse markets to open your first paper trade.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/50 text-xs text-slate-400">
            <th className="text-left py-3 pr-4 font-medium">Market</th>
            <th className="text-center py-3 px-3 font-medium">Side</th>
            <th className="text-right py-3 px-3 font-medium">Shares</th>
            <th className="text-right py-3 px-3 font-medium">Entry</th>
            <th className="text-right py-3 px-3 font-medium">Current</th>
            <th className="text-right py-3 px-3 font-medium">P&L</th>
            <th className="text-center py-3 px-3 font-medium">Edge</th>
            <th className="text-center py-3 px-3 font-medium">Status</th>
            <th className="text-right py-3 pl-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {trades.map((t) => {
            const curr = t.current_price ?? t.entry_price;
            const exit = t.exit_price ?? curr;
            const pnl = t.shares * ((t.status === "closed" ? exit : curr) - t.entry_price);
            const isOpen = t.status === "open";

            return (
              <tr key={t.id} className={`hover:bg-slate-800/30 ${!isOpen ? "opacity-60" : ""}`}>
                <td className="py-3 pr-4 max-w-xs">
                  <p className="text-white truncate">{t.question}</p>
                  {t.notes && <p className="text-xs text-slate-500 mt-0.5 truncate italic">{t.notes}</p>}
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(t.opened_at).toLocaleDateString()}
                  </p>
                </td>
                <td className="py-3 px-3 text-center">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold ${
                      t.outcome === "YES"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {t.outcome}
                  </span>
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-300">{t.shares}</td>
                <td className="py-3 px-3 text-right font-mono text-slate-300">
                  {(t.entry_price * 100).toFixed(1)}¢
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-300">
                  {isOpen ? `${(curr * 100).toFixed(1)}¢` : `${(exit * 100).toFixed(1)}¢`}
                </td>
                <td className="py-3 px-3 text-right">
                  <PnlBadge value={pnl} />
                </td>
                <td className="py-3 px-3 text-center">
                  {t.edge_score != null ? (
                    <EdgeBadge score={t.edge_score} size="sm" />
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>
                <td className="py-3 px-3 text-center">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      isOpen
                        ? "bg-blue-500/20 text-blue-400"
                        : t.resolved
                        ? "bg-purple-500/20 text-purple-400"
                        : "bg-slate-700 text-slate-400"
                    }`}
                  >
                    {isOpen ? "OPEN" : t.resolved ? "RESOLVED" : "CLOSED"}
                  </span>
                </td>
                <td className="py-3 pl-3 text-right">
                  <div className="flex gap-1 justify-end">
                    {isOpen && (
                      <button
                        onClick={() => closeTrade(t.id)}
                        disabled={closing === t.id}
                        className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors disabled:opacity-50"
                      >
                        {closing === t.id ? "..." : "Close"}
                      </button>
                    )}
                    <button
                      onClick={() => deleteTrade(t.id)}
                      className="px-2 py-1 text-xs bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded transition-colors"
                    >
                      Del
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
