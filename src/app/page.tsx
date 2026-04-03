"use client";

import { useState, useEffect, useCallback } from "react";
import MarketCard from "@/components/MarketCard";
import TradeModal from "@/components/TradeModal";
import RealTradeModal from "@/components/RealTradeModal";
import TradesTable from "@/components/TradesTable";
import PortfolioStatsPanel from "@/components/PortfolioStats";
import BankrollPanel from "@/components/BankrollPanel";
import CrossMarketPanel from "@/components/CrossMarketPanel";
import type { PortfolioStats, PaperTrade, Bankroll } from "@/types";

type Tab = "markets" | "cross" | "paper" | "real";

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

type PortfolioData = {
  stats: PortfolioStats;
  trades: PaperTrade[];
  bankroll: Bankroll;
};

export default function Home() {
  const [tab, setTab] = useState<Tab>("markets");

  // Markets
  const [markets, setMarkets] = useState<ScoredMarket[]>([]);
  const [marketsLoading, setMarketsLoading] = useState(false);
  const [marketsError, setMarketsError] = useState("");
  const [search, setSearch] = useState("");
  const [minEdge, setMinEdge] = useState(0);

  // Trade modals
  const [selectedMarket, setSelectedMarket] = useState<ScoredMarket | null>(null);
  const [showRealModal, setShowRealModal] = useState(false);
  const [realPrefill, setRealPrefill] = useState<{ marketId: string; question: string } | null>(null);

  // Portfolios
  const [paperPortfolio, setPaperPortfolio] = useState<PortfolioData | null>(null);
  const [realPortfolio, setRealPortfolio] = useState<PortfolioData | null>(null);
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

  const loadPortfolio = useCallback(async (type: "paper" | "real") => {
    setPortfolioLoading(true);
    try {
      const res = await fetch(`/api/portfolio?type=${type}`);
      const data = await res.json();
      if (res.ok) {
        if (type === "paper") setPaperPortfolio(data);
        else setRealPortfolio(data);
      }
    } finally {
      setPortfolioLoading(false);
    }
  }, []);

  const loadBothPortfolios = useCallback(() => {
    loadPortfolio("paper");
    loadPortfolio("real");
  }, [loadPortfolio]);

  useEffect(() => {
    if (tab === "markets") loadMarkets();
    if (tab === "paper") loadPortfolio("paper");
    if (tab === "real") loadPortfolio("real");
  }, [tab, loadPortfolio]);

  const filtered = markets.filter((m) => {
    const matchSearch = !search || m.question.toLowerCase().includes(search.toLowerCase());
    const matchEdge = m.edge.score >= minEdge;
    return matchSearch && matchEdge;
  });

  function openRealFromCross(marketId: string, question: string) {
    setRealPrefill({ marketId, question });
    setShowRealModal(true);
  }

  const tabs: { id: Tab; label: string; badge?: string }[] = [
    { id: "markets", label: "Markets" },
    { id: "cross", label: "Cross-Market" },
    {
      id: "paper",
      label: "Paper Portfolio",
      badge: paperPortfolio ? String(paperPortfolio.stats.open_positions) : undefined,
    },
    {
      id: "real",
      label: "Real Trades",
      badge: realPortfolio ? String(realPortfolio.stats.open_positions) : undefined,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-xs font-bold text-white">P</div>
            <span className="text-white font-semibold tracking-tight hidden sm:block">Polymarket Research</span>
          </div>
          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  tab === t.id
                    ? t.id === "real"
                      ? "bg-amber-600/20 text-amber-400 border border-amber-500/30"
                      : "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {t.id === "real" && <span className="text-amber-400 text-[10px] font-bold">$</span>}
                {t.label}
                {t.badge && (
                  <span className="bg-slate-700 text-slate-300 text-xs rounded px-1">{t.badge}</span>
                )}
              </button>
            ))}
          </nav>
          {/* Quick "Log Real Trade" button */}
          <button
            onClick={() => { setRealPrefill(null); setShowRealModal(true); }}
            className="shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            + Real Trade
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">

        {/* ─── MARKETS TAB ─── */}
        {tab === "markets" && (
          <div>
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
                  type="range" min={0} max={90} step={5} value={minEdge}
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

            <div className="flex gap-4 mb-5 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />Score ≥70 = HIGH EDGE</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500" />45–69 = WATCH</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-500" />&lt;45 = LOW</span>
            </div>

            {marketsError && (
              <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-4 mb-6 text-red-400 text-sm">{marketsError}</div>
            )}

            {marketsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="bg-slate-900 border border-slate-700/30 rounded-xl p-4 animate-pulse h-44" />
                ))}
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-500 mb-4">{filtered.length} markets · sorted by edge score</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((m) => (
                    <MarketCard key={m.id} market={m} onTrade={() => setSelectedMarket(m)} />
                  ))}
                </div>
                {filtered.length === 0 && (
                  <div className="text-center py-20 text-slate-500">No markets match your filters.</div>
                )}
              </>
            )}
          </div>
        )}

        {/* ─── CROSS-MARKET TAB ─── */}
        {tab === "cross" && (
          <div>
            <div className="mb-6">
              <h2 className="text-white font-semibold">Cross-Market Analysis</h2>
              <p className="text-slate-400 text-sm mt-0.5">
                Compares Polymarket vs. Kalshi probabilities on matched events.
                A large gap signals potential mispricing on one venue.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">Blue bar</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-2 bg-blue-500 rounded" />
                  <span className="text-xs text-slate-300">Polymarket YES price</span>
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">Orange bar</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-2 bg-orange-500/60 rounded" />
                  <span className="text-xs text-slate-300">Kalshi YES mid-price</span>
                </div>
              </div>
              <div className="bg-slate-900 border border-yellow-700/30 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">Yellow highlight</p>
                <span className="text-xs text-yellow-400">Discrepancy ≥5% — strong signal</span>
              </div>
            </div>
            <CrossMarketPanel onTrade={openRealFromCross} />
          </div>
        )}

        {/* ─── PAPER PORTFOLIO TAB ─── */}
        {tab === "paper" && (
          <PortfolioTab
            tradeType="paper"
            portfolio={paperPortfolio}
            loading={portfolioLoading}
            onRefresh={() => loadPortfolio("paper")}
            onOpenRealModal={() => { setRealPrefill(null); setShowRealModal(true); }}
          />
        )}

        {/* ─── REAL TRADES TAB ─── */}
        {tab === "real" && (
          <PortfolioTab
            tradeType="real"
            portfolio={realPortfolio}
            loading={portfolioLoading}
            onRefresh={() => loadPortfolio("real")}
            onOpenRealModal={() => { setRealPrefill(null); setShowRealModal(true); }}
          />
        )}
      </main>

      {/* Paper Trade Modal */}
      {selectedMarket && (
        <TradeModal
          market={selectedMarket}
          onClose={() => setSelectedMarket(null)}
          onSuccess={() => {
            setSelectedMarket(null);
            loadBothPortfolios();
          }}
        />
      )}

      {/* Real Trade Modal */}
      {showRealModal && (
        <RealTradeModal
          prefillMarketId={realPrefill?.marketId ?? ""}
          prefillQuestion={realPrefill?.question ?? ""}
          cashAvailable={realPortfolio?.bankroll.current_balance ?? 1000}
          onClose={() => { setShowRealModal(false); setRealPrefill(null); }}
          onSuccess={() => {
            setShowRealModal(false);
            setRealPrefill(null);
            loadPortfolio("real");
          }}
        />
      )}
    </div>
  );
}

// ─── Shared Portfolio Tab ────────────────────────────────────────────────────

function PortfolioTab({
  tradeType,
  portfolio,
  loading,
  onRefresh,
  onOpenRealModal,
}: {
  tradeType: "paper" | "real";
  portfolio: PortfolioData | null;
  loading: boolean;
  onRefresh: () => void;
  onOpenRealModal: () => void;
}) {
  const isReal = tradeType === "real";

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-3">
        <div>
          <div className="flex items-center gap-2">
            {isReal && (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 rounded">
                REAL $
              </span>
            )}
            <h2 className="text-white font-semibold">
              {isReal ? "Real Money Trades" : "Paper Portfolio"}
            </h2>
          </div>
          <p className="text-slate-400 text-sm mt-0.5">
            {isReal
              ? "Actual trades placed on Polymarket — tracks your real P&L"
              : "Simulated trades for research and calibration"}
          </p>
        </div>
        <div className="flex gap-2">
          {isReal && (
            <button
              onClick={onOpenRealModal}
              className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              + Log Trade
            </button>
          )}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Updating..." : "Refresh Prices"}
          </button>
        </div>
      </div>

      {loading && !portfolio ? (
        <div className="text-slate-500 text-sm">Loading...</div>
      ) : portfolio ? (
        <>
          {/* Bankroll */}
          <div className="mb-4">
            <BankrollPanel
              bankroll={portfolio.bankroll}
              totalPnl={portfolio.stats.total_pnl}
              onUpdated={onRefresh}
            />
          </div>

          {/* Stats grid */}
          <div className="mb-6">
            <PortfolioStatsPanel stats={portfolio.stats} isReal={isReal} />
          </div>

          {/* Calibration banner */}
          {portfolio.stats.closed_positions >= 5 && (
            <div className={`mb-6 p-4 rounded-xl border text-sm ${
              portfolio.stats.win_rate >= 0.51
                ? "bg-emerald-900/20 border-emerald-700/30 text-emerald-300"
                : "bg-red-900/20 border-red-700/30 text-red-300"
            }`}>
              {portfolio.stats.win_rate >= 0.51
                ? `Beating 51% — ${(portfolio.stats.win_rate * 100).toFixed(0)}% win rate over ${portfolio.stats.closed_positions} closed ${isReal ? "real" : "paper"} trades. Edge is working.`
                : `Below 51% — ${(portfolio.stats.win_rate * 100).toFixed(0)}% over ${portfolio.stats.closed_positions} trades. Review your edge criteria.`
              }
              {` ROI: ${portfolio.stats.roi_pct >= 0 ? "+" : ""}${portfolio.stats.roi_pct.toFixed(1)}% on $${portfolio.stats.starting_balance.toFixed(0)} bankroll.`}
            </div>
          )}

          <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-4">
            <h3 className="text-sm font-medium text-white mb-4">All {isReal ? "Real" : "Paper"} Trades</h3>
            <TradesTable
              trades={portfolio.trades}
              onRefresh={onRefresh}
              isReal={isReal}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
