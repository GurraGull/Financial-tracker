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
}

export interface PriceSnapshot {
  market_id: string;
  yes_price: number;
  no_price: number;
  volume: number | null;
  recorded_at: string;
}
