"use client";

import { useState, useEffect, useCallback } from "react";
import MarketCard from "@/components/MarketCard";
import TradeModal from "@/components/TradeModal";
import TradesTable from "@/components/TradesTable";
import PortfolioStatsPanel from "@/components/PortfolioStats";
import type { PortfolioStats, PaperTrade } from "@/types";

type Tab = "markets" | "portfolio";

type ScoredMarket = {
  id: string;
  question: string;
  yes_price: number;
  no_price: number;
  volume: number;
  volume_24hr?: number;
  liquidity?: number;
  end_date_iso?: string;
  edge: { score: number; reasons: string[] };
};

export default function Home() {
  const [tab, setTab] = useState<Tab>("markets");

  // Markets
  const [markets, setMarkets] = useState<ScoredMarket[]>([]);
  const [marketsLoading, setMarketsLoading] = useState(false);
  const [marketsError, setMarketsError] = useState("");
  const [search, setSearch] = useState("");
  const [minEdge, setMinEdge] = useState(0);

  // Trade modal
  const [selectedMarket, setSelectedMarket] = useState<ScoredMarket | null>(null);

  // Portfolio
  const [portfolio, setPortfolio] = useState<{ stats: PortfolioStats; trades: PaperTrade[] } | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);

  async function loadMarkets() {
    setMarketsLoading(true);
    setMarketsError("");
    try {
      const res = await fetch("/api/markets?limit=100");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMarkets(data.markets ?? []);
    } catch (err: unknown) {
      setMarketsError(err instanceof Error ? err.message : "Failed to load markets");
    } finally {
      setMarketsLoading(false);
    }
  }

  const loadPortfolio = useCallback(async () => {
    setPortfolioLoading(true);
    try {
      const res = await fetch("/api/portfolio");
      const data = await res.json();
      if (res.ok) setPortfolio(data);
    } finally {
      setPortfolioLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "markets") loadMarkets();
    if (tab === "portfolio") loadPortfolio();
  }, [tab, loadPortfolio]);

  const filtered = markets.filter((m) => {
    const matchSearch = !search || m.question.toLowerCase().includes(search.toLowerCase());
    const matchEdge = m.edge.score >= minEdge;
    return matchSearch && matchEdge;
  });

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-xs font-bold text-white">P</div>
            <span className="text-white font-semibold tracking-tight">Polymarket Research</span>
            <span className="text-slate-500 text-xs hidden sm:block">Paper Trading Dashboard</span>
          </div>
          <div className="flex items-center gap-1">
            {(["markets", "portfolio"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                  tab === t
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {t}
                {t === "portfolio" && portfolio && (
                  <span className="ml-1.5 bg-slate-700 text-slate-300 text-xs rounded px-1">
                    {portfolio.stats.open_positions}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* ─── MARKETS TAB ─── */}
        {tab === "markets" && (
          <div>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                type="text"
                placeholder="Search markets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5">
                <span className="text-xs text-slate-400 whitespace-nowrap">Min Edge:</span>
                <input
                  type="range"
                  min={0}
                  max={90}
                  step={5}
                  value={minEdge}
                  onChange={(e) => setMinEdge(Number(e.target.value))}
                  className="w-24 accent-blue-500"
                />
                <span className="text-xs text-blue-400 font-mono w-6">{minEdge}</span>
              </div>
              <button
                onClick={loadMarkets}
                disabled={marketsLoading}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors disabled:opacity-50"
              >
                {marketsLoading ? "Loading..." : "Refresh"}
              </button>
            </div>

            {/* Edge legend */}
            <div className="flex gap-4 mb-5 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Score ≥70 = HIGH EDGE
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                45–69 = WATCH
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                &lt;45 = LOW
              </span>
            </div>

            {marketsError && (
              <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-4 mb-6 text-red-400 text-sm">
                {marketsError}
              </div>
            )}

            {marketsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="bg-slate-900 border border-slate-700/30 rounded-xl p-4 animate-pulse h-44" />
                ))}
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-500 mb-4">
                  {filtered.length} markets · sorted by edge score
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((m) => (
                    <MarketCard
                      key={m.id}
                      market={m}
                      onTrade={() => setSelectedMarket(m)}
                    />
                  ))}
                </div>
                {filtered.length === 0 && !marketsLoading && (
                  <div className="text-center py-20 text-slate-500">
                    No markets match your filters.
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ─── PORTFOLIO TAB ─── */}
        {tab === "portfolio" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-white font-semibold">Paper Portfolio</h2>
                <p className="text-slate-400 text-sm mt-0.5">Track your research trades and calibration</p>
              </div>
              <button
                onClick={loadPortfolio}
                disabled={portfolioLoading}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors disabled:opacity-50"
              >
                {portfolioLoading ? "Updating..." : "Refresh Prices"}
              </button>
            </div>

            {portfolioLoading && !portfolio ? (
              <div className="text-slate-500 text-sm">Loading portfolio...</div>
            ) : portfolio ? (
              <>
                <div className="mb-6">
                  <PortfolioStatsPanel stats={portfolio.stats} />
                </div>

                {/* Calibration note */}
                {portfolio.stats.closed_positions >= 5 && (
                  <div className={`mb-6 p-4 rounded-xl border text-sm ${
                    portfolio.stats.win_rate >= 0.51
                      ? "bg-emerald-900/20 border-emerald-700/30 text-emerald-300"
                      : "bg-red-900/20 border-red-700/30 text-red-300"
                  }`}>
                    {portfolio.stats.win_rate >= 0.51
                      ? `Beating 51% — your win rate is ${(portfolio.stats.win_rate * 100).toFixed(0)}% over ${portfolio.stats.closed_positions} closed trades. Edge algorithm is working.`
                      : `Below 51% — ${(portfolio.stats.win_rate * 100).toFixed(0)}% win rate over ${portfolio.stats.closed_positions} trades. Review your edge reasoning.`
                    }
                  </div>
                )}

                <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-white mb-4">All Trades</h3>
                  <TradesTable trades={portfolio.trades} onRefresh={loadPortfolio} />
                </div>
              </>
            ) : null}
          </div>
        )}
      </main>

      {/* Trade Modal */}
      {selectedMarket && (
        <TradeModal
          market={selectedMarket}
          onClose={() => setSelectedMarket(null)}
          onSuccess={() => {
            setSelectedMarket(null);
            if (tab === "portfolio") loadPortfolio();
          }}
        />
      )}
    </div>
  );
}
