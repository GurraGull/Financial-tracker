"use client";

import { useState } from "react";
import type { Bankroll } from "@/types";

interface BankrollPanelProps {
  bankroll: Bankroll;
  totalPnl: number;
  onUpdated: () => void;
}

export default function BankrollPanel({ bankroll, totalPnl, onUpdated }: BankrollPanelProps) {
  const [editing, setEditing] = useState(false);
  const [newBalance, setNewBalance] = useState(String(bankroll.starting_balance));
  const [saving, setSaving] = useState(false);

  const isReal = bankroll.trade_type === "real";
  const roi = bankroll.starting_balance > 0 ? (totalPnl / bankroll.starting_balance) * 100 : 0;
  const cashPct = bankroll.starting_balance > 0
    ? (bankroll.current_balance / bankroll.starting_balance) * 100
    : 0;

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/bankroll", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trade_type: bankroll.trade_type,
          starting_balance: Number(newBalance),
        }),
      });
      onUpdated();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`rounded-xl border p-4 ${
      isReal
        ? "bg-amber-950/20 border-amber-700/30"
        : "bg-slate-900 border-slate-700/50"
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isReal && (
            <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30 rounded">
              REAL $
            </span>
          )}
          <span className="text-sm font-medium text-white capitalize">
            {bankroll.trade_type} Bankroll
          </span>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="text-xs text-slate-400 hover:text-white"
        >
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>

      {editing ? (
        <div className="flex gap-2">
          <input
            type="number"
            value={newBalance}
            onChange={(e) => setNewBalance(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
            placeholder="Starting balance"
          />
          <button
            onClick={save}
            disabled={saving}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors disabled:opacity-50"
          >
            {saving ? "..." : "Save"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Starting</p>
            <p className="font-mono text-white font-semibold">${bankroll.starting_balance.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Cash Available</p>
            <p className={`font-mono font-semibold ${cashPct < 20 ? "text-red-400" : "text-emerald-400"}`}>
              ${bankroll.current_balance.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">ROI</p>
            <p className={`font-mono font-semibold ${roi >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {roi >= 0 ? "+" : ""}{roi.toFixed(1)}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
