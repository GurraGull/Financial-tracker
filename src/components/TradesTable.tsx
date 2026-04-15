"use client";

import { useState } from "react";
import PnlBadge from "./PnlBadge";
import EdgeBadge from "./EdgeBadge";
import type { PaperTrade } from "@/types";

interface TradesTableProps {
  trades: PaperTrade[];
  onRefresh: () => void;
  isReal?: boolean;
}

export default function TradesTable({ trades, onRefresh, isReal }: TradesTableProps) {
  const [closing, setClosing] = useState<number | null>(null);
  const [manualExit, setManualExit] = useState<{ id: number; price: string } | null>(null);

  async function closeTrade(id: number, manualPrice?: number) {
    setClosing(id);
    try {
      const body: Record<string, unknown> = { action: "close" };
      if (manualPrice != null) body.manual_exit_price = manualPrice;
      await fetch(`/api/trades/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setManualExit(null);
      onRefresh();
    } finally {
      setClosing(null);
    }
  }

  async function deleteTrade(id: number) {
    if (!confirm("Delete this trade? Any invested amount will be returned to your bankroll.")) return;
    await fetch(`/api/trades/${id}`, { method: "DELETE" });
    onRefresh();
  }

  if (trades.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="text-3xl mb-3">{isReal ? "💰" : "📊"}</p>
        <p>{isReal ? "No real trades logged yet. Use '+ Real Trade' to log one." : "No paper trades yet — browse markets to open your first paper trade."}</p>
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
            <th className="text-right py-3 px-3 font-medium">{isReal ? "Exit / Live" : "Current"}</th>
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
              <>
                <tr key={t.id} className={`hover:bg-slate-800/30 ${!isOpen ? "opacity-60" : ""}`}>
                  <td className="py-3 pr-4 max-w-xs">
                    <div className="flex items-center gap-1.5">
                      {isReal && (
                        <span className="shrink-0 text-[9px] font-bold text-amber-400 border border-amber-500/30 rounded px-1">REAL</span>
                      )}
                      <p className="text-white truncate">{t.question}</p>
                    </div>
                    {t.notes && <p className="text-xs text-slate-500 mt-0.5 truncate italic">{t.notes}</p>}
                    <p className="text-xs text-slate-500 mt-0.5">{new Date(t.opened_at).toLocaleDateString()}</p>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      t.outcome === "YES" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                    }`}>
                      {t.outcome}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300">{t.shares}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300">{(t.entry_price * 100).toFixed(1)}¢</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300">
                    {isOpen ? `${(curr * 100).toFixed(1)}¢` : `${(exit * 100).toFixed(1)}¢`}
                  </td>
                  <td className="py-3 px-3 text-right"><PnlBadge value={pnl} /></td>
                  <td className="py-3 px-3 text-center">
                    {t.edge_score != null ? <EdgeBadge score={t.edge_score} size="sm" /> : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      isOpen
                        ? isReal ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"
                        : t.resolved ? "bg-purple-500/20 text-purple-400" : "bg-slate-700 text-slate-400"
                    }`}>
                      {isOpen ? "OPEN" : t.resolved ? "RESOLVED" : "CLOSED"}
                    </span>
                  </td>
                  <td className="py-3 pl-3 text-right">
                    <div className="flex gap-1 justify-end">
                      {isOpen && (
                        <>
                          {isReal ? (
                            <button
                              onClick={() => setManualExit({ id: t.id, price: String(curr) })}
                              className="px-2 py-1 text-xs bg-amber-800/40 hover:bg-amber-700/50 text-amber-300 rounded transition-colors"
                            >
                              Close
                            </button>
                          ) : (
                            <button
                              onClick={() => closeTrade(t.id)}
                              disabled={closing === t.id}
                              className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors disabled:opacity-50"
                            >
                              {closing === t.id ? "..." : "Close"}
                            </button>
                          )}
                        </>
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
                {/* Manual exit row for real trades */}
                {manualExit?.id === t.id && (
                  <tr key={`${t.id}-exit`} className="bg-amber-950/20">
                    <td colSpan={9} className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-amber-300">Enter exit price (0–1):</span>
                        <input
                          type="number"
                          min="0.001"
                          max="0.999"
                          step="0.001"
                          value={manualExit.price}
                          onChange={(e) => setManualExit({ ...manualExit, price: e.target.value })}
                          className="w-28 bg-slate-800 border border-amber-600/40 rounded px-2 py-1 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                        />
                        <button
                          onClick={() => closeTrade(t.id, Number(manualExit.price))}
                          disabled={closing === t.id}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs rounded transition-colors disabled:opacity-50"
                        >
                          {closing === t.id ? "Closing..." : "Confirm Close"}
                        </button>
                        <button
                          onClick={() => setManualExit(null)}
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
