"use client";

import EdgeBadge from "./EdgeBadge";

interface MarketCardProps {
  market: {
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
  onTrade: () => void;
}

export default function MarketCard({ market, onTrade }: MarketCardProps) {
  const yesP = market.yes_price;
  const days = market.end_date_iso
    ? Math.round((new Date(market.end_date_iso).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-sm text-white leading-snug line-clamp-2 flex-1">{market.question}</p>
        <EdgeBadge score={market.edge.score} />
      </div>

      {/* Probability bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-emerald-400 font-mono">{(yesP * 100).toFixed(1)}% YES</span>
          <span className="text-red-400 font-mono">{((1 - yesP) * 100).toFixed(1)}% NO</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
            style={{ width: `${yesP * 100}%` }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-3 text-xs text-slate-400 mb-3">
        <span>Vol: <span className="text-slate-300">${(market.volume / 1000).toFixed(0)}K</span></span>
        {market.volume_24hr && (
          <span>24h: <span className="text-slate-300">${(market.volume_24hr / 1000).toFixed(0)}K</span></span>
        )}
        {days !== null && days >= 0 && (
          <span>Closes: <span className="text-slate-300">{days}d</span></span>
        )}
      </div>

      {/* Top edge reason */}
      {market.edge.reasons[0] && (
        <p className="text-xs text-slate-500 mb-3 italic line-clamp-1">{market.edge.reasons[0]}</p>
      )}

      <button
        onClick={onTrade}
        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-lg transition-colors"
      >
        Paper Trade
      </button>
    </div>
  );
}
