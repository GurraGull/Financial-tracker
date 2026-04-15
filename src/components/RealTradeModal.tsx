"use client";

import { useState } from "react";

interface RealTradeModalProps {
  onClose: () => void;
  onSuccess: () => void;
  prefillMarketId?: string;
  prefillQuestion?: string;
  cashAvailable: number;
}

export default function RealTradeModal({
  onClose,
  onSuccess,
  prefillMarketId = "",
  prefillQuestion = "",
  cashAvailable,
}: RealTradeModalProps) {
  const [marketId, setMarketId] = useState(prefillMarketId);
  const [question, setQuestion] = useState(prefillQuestion);
  const [outcome, setOutcome] = useState<"YES" | "NO">("YES");
  const [shares, setShares] = useState("10");
  const [entryPrice, setEntryPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const price = Number(entryPrice) || 0;
  const cost = Number(shares) * price;
  const insufficient = cost > cashAvailable;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!confirmed) {
      setError("Please confirm this is real money before proceeding.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          market_id: marketId,
          outcome,
          shares: Number(shares),
          notes: notes || null,
          trade_type: "real",
          manual_entry_price: price,
          manual_question: question,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error logging trade");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-amber-700/40 rounded-xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-amber-700/30 bg-amber-950/20 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/40 rounded">
                REAL MONEY
              </span>
              <h2 className="text-white font-semibold text-sm">Log Real Trade</h2>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-lg leading-none">×</button>
          </div>
          <p className="text-xs text-amber-300/70 mt-1.5">
            This logs an actual trade you placed on Polymarket. Your real bankroll will be debited.
          </p>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {/* Market ID */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Polymarket Market ID</label>
            <input
              value={marketId}
              onChange={(e) => setMarketId(e.target.value)}
              required
              placeholder="e.g. 0x1234..."
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Find this in the Polymarket URL or market page
            </p>
          </div>

          {/* Question */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Market Question</label>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
              placeholder="Will X happen by Y date?"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Outcome + Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Side</label>
              <div className="flex gap-1.5">
                {(["YES", "NO"] as const).map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setOutcome(o)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      outcome === o
                        ? o === "YES" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Entry Price (0–1)</label>
              <input
                type="number"
                min="0.001"
                max="0.999"
                step="0.001"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                required
                placeholder="e.g. 0.65"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Shares */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Shares</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
            />
            <div className="mt-1.5 flex justify-between text-xs">
              <span className="text-slate-400">
                Cost: <span className={`font-mono font-semibold ${insufficient ? "text-red-400" : "text-white"}`}>
                  ${cost.toFixed(2)}
                </span>
              </span>
              <span className="text-slate-400">
                Cash: <span className="font-mono text-emerald-400">${cashAvailable.toFixed(2)}</span>
              </span>
            </div>
            {insufficient && (
              <p className="text-red-400 text-xs mt-1">Exceeds available real bankroll</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Notes / Thesis</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Why did you take this trade?"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 resize-none placeholder:text-slate-600"
            />
          </div>

          {/* Confirmation */}
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 accent-amber-500"
            />
            <span className="text-xs text-amber-300/80">
              I confirm this is a real money trade I have already placed on Polymarket.
              I understand this tracker does not place trades on my behalf.
            </span>
          </label>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading || !confirmed || insufficient || !shares || !entryPrice || !question || !marketId}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            {loading ? "Logging..." : "Log Real Trade"}
          </button>
        </form>
      </div>
    </div>
  );
}
