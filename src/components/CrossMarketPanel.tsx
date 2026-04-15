"use client";

import { useState, useEffect } from "react";
import type { CrossMarketMatch } from "@/types";

interface CrossMarketPanelProps {
  onTrade?: (marketId: string, question: string) => void;
}

export default function CrossMarketPanel({ onTrade }: CrossMarketPanelProps) {
  const [matches, setMatches] = useState<CrossMarketMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/cross-market?limit=100");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMatches(data.matches ?? []);
      setLoaded(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  // Auto-load on mount
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-white">Cross-Market Comparison</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Polymarket vs. Kalshi — discrepancies ≥2% surface here
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? "Scanning..." : "Refresh"}
        </button>
      </div>

      {error && (
        <p className="text-red-400 text-xs mb-3">{error}</p>
      )}

      {loading && !loaded && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-slate-800/50 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {loaded && matches.length === 0 && (
        <p className="text-slate-500 text-sm text-center py-8">
          No significant cross-market discrepancies found right now.
        </p>
      )}

      {matches.length > 0 && (
        <div className="space-y-2">
          {matches.map((m) => {
            const isPolyHigher = m.delta_pct < 0;
            const absDelta = Math.abs(m.delta_pct);
            const isLarge = absDelta >= 0.05;

            return (
              <div
                key={m.kalshi_ticker}
                className={`rounded-lg p-3 border transition-colors ${
                  isLarge
                    ? "bg-yellow-900/10 border-yellow-700/20"
                    : "bg-slate-800/40 border-slate-700/20"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white leading-snug truncate">{m.poly_question}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                      Kalshi: {m.kalshi_title}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className={`text-xs font-mono font-semibold ${isLarge ? "text-yellow-400" : "text-slate-300"}`}>
                      {m.delta_pct > 0 ? "+" : ""}{(m.delta_pct * 100).toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {isPolyHigher ? "Poly higher" : "Kalshi higher"}
                    </div>
                  </div>
                </div>

                {/* Price comparison bar */}
                <div className="mt-2 flex items-center gap-2 text-[10px]">
                  <span className="text-slate-400">
                    Poly <span className="text-white font-mono">{(m.poly_yes_price * 100).toFixed(1)}¢</span>
                  </span>
                  <div className="flex-1 h-1 bg-slate-700 rounded-full relative overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full bg-blue-500 rounded-full"
                      style={{ width: `${m.poly_yes_price * 100}%` }}
                    />
                    <div
                      className="absolute left-0 top-0 h-full bg-orange-500 rounded-full opacity-60"
                      style={{ width: `${m.kalshi_yes_mid * 100}%` }}
                    />
                  </div>
                  <span className="text-slate-400">
                    Kalshi <span className="text-white font-mono">{(m.kalshi_yes_mid * 100).toFixed(1)}¢</span>
                  </span>
                  {onTrade && (
                    <button
                      onClick={() => onTrade(m.poly_market_id, m.poly_question)}
                      className="ml-1 px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-[10px] transition-colors"
                    >
                      Trade
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
