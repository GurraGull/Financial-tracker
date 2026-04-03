"use client";

import { useState } from "react";

interface TradeModalProps {
  market: {
    id: string;
    question: string;
    yes_price: number;
    no_price: number;
    edge: { score: number; reasons: string[] };
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function TradeModal({ market, onClose, onSuccess }: TradeModalProps) {
  const [outcome, setOutcome] = useState<"YES" | "NO">("YES");
  const [shares, setShares] = useState("10");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const price = outcome === "YES" ? market.yes_price : market.no_price;
  const cost = Number(shares) * price;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          market_id: market.id,
          outcome,
          shares: Number(shares),
          notes: notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error opening trade");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl">
        <div className="p-5 border-b border-slate-700">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-white font-semibold text-sm leading-snug">{market.question}</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white shrink-0 text-lg leading-none">×</button>
          </div>
          <div className="mt-2 flex gap-2 text-xs text-slate-400">
            <span>YES: <span className="text-white font-mono">{(market.yes_price * 100).toFixed(1)}¢</span></span>
            <span>·</span>
            <span>NO: <span className="text-white font-mono">{(market.no_price * 100).toFixed(1)}¢</span></span>
          </div>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {/* Edge reasons */}
          <div className="bg-slate-800/50 rounded-lg p-3 space-y-1">
            {market.edge.reasons.map((r, i) => (
              <p key={i} className="text-xs text-slate-300">• {r}</p>
            ))}
          </div>

          {/* Outcome selector */}
          <div>
            <label className="block text-xs text-slate-400 mb-2">Position</label>
            <div className="flex gap-2">
              {(["YES", "NO"] as const).map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOutcome(o)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    outcome === o
                      ? o === "YES"
                        ? "bg-emerald-600 text-white"
                        : "bg-red-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  {o} · {o === "YES" ? (market.yes_price * 100).toFixed(1) : (market.no_price * 100).toFixed(1)}¢
                </button>
              ))}
            </div>
          </div>

          {/* Shares */}
          <div>
            <label className="block text-xs text-slate-400 mb-2">Shares</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
            />
            <p className="mt-1.5 text-xs text-slate-400">
              Cost: <span className="text-white font-mono">${cost.toFixed(2)}</span>
              {" · "}Payout if correct: <span className="text-emerald-400 font-mono">${Number(shares).toFixed(2)}</span>
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-slate-400 mb-2">Research notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Why do you have edge here?"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 resize-none placeholder:text-slate-600"
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading || !shares || Number(shares) <= 0}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            {loading ? "Opening..." : "Open Paper Trade"}
          </button>
        </form>
      </div>
    </div>
  );
}
