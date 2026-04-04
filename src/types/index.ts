export interface PolymarketToken {
  token_id: string;
  outcome: string;
  price: number;
  winner?: boolean;
}

export interface PolymarketMarket {
  id: string;
  question: string;
  description?: string;
  end_date_iso?: string;
  game_start_time?: string;
  seconds_delay?: number;
  active: boolean;
  closed: boolean;
  archived: boolean;
  volume: number;
  volume_24hr?: number;
  liquidity?: number;
  tokens: PolymarketToken[];
  category?: string;
  tags?: string[];
  market_slug?: string;
}

export interface EdgeScore {
  score: number;           // 0-100, higher = more interesting
  reasons: string[];
  signals: {
    volumeSpike: number;       // 0-1
    priceMovement24h: number;  // -1 to 1
    daysToResolution: number;
    spreadWidth: number;       // 0-1 (yes+no - 1)
    uncertaintyBonus: number;  // 0-1, peaks at 0.5
    lowLiquidity: number;      // 0-1, lower liquidity = more opportunity
  };
}

export interface PaperTrade {
  id: number;
  market_id: string;
  question: string;
  outcome: "YES" | "NO";
  shares: number;
  entry_price: number;
  current_price: number | null;
  status: "open" | "closed";
  exit_price: number | null;
  edge_score: number | null;
  edge_reason: string | null;
  notes: string | null;
  trade_type: "paper" | "real";
  opened_at: string;
  closed_at: string | null;
  resolved: number;
  resolved_yes: number;
}

export interface PortfolioStats {
  total_invested: number;
  current_value: number;
  realized_pnl: number;
  unrealized_pnl: number;
  total_pnl: number;
  win_rate: number;
  open_positions: number;
  closed_positions: number;
  total_trades: number;
  cash_available: number;
  starting_balance: number;
  roi_pct: number;
}

export interface Bankroll {
  id: number;
  trade_type: "paper" | "real";
  starting_balance: number;
  current_balance: number;
  updated_at: string;
}

export interface KalshiMarket {
  ticker: string;
  title: string;
  yes_ask: number;
  yes_bid: number;
  no_ask: number;
  no_bid: number;
  volume: number;
  open_interest: number;
  status: string;
}

export interface CrossMarketMatch {
  kalshi_ticker: string;
  kalshi_title: string;
  kalshi_yes_mid: number;
  poly_yes_price: number;
  delta_pct: number;       // kalshi - poly, positive = kalshi higher
  poly_market_id: string;
  poly_question: string;
}

export interface AutoTraderRun {
  id: number;
  ran_at: string;
  markets_scanned: number;
  trades_opened: number;
  trades_closed: number;
  cash_deployed: number;
  cash_returned: number;
  decisions: string; // JSON
}

export interface PriceSnapshot {
  market_id: string;
  yes_price: number;
  no_price: number;
  volume: number | null;
  recorded_at: string;
}
