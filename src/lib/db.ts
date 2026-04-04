import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "paper_trades.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS paper_trades (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      market_id   TEXT NOT NULL,
      question    TEXT NOT NULL,
      outcome     TEXT NOT NULL CHECK(outcome IN ('YES','NO')),
      shares      REAL NOT NULL CHECK(shares > 0),
      entry_price REAL NOT NULL CHECK(entry_price > 0 AND entry_price < 1),
      current_price REAL,
      status      TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed')),
      exit_price  REAL,
      edge_score  REAL,
      edge_reason TEXT,
      notes       TEXT,
      trade_type  TEXT NOT NULL DEFAULT 'paper' CHECK(trade_type IN ('paper','real')),
      opened_at   TEXT NOT NULL DEFAULT (datetime('now')),
      closed_at   TEXT,
      resolved    INTEGER DEFAULT 0,
      resolved_yes INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS price_snapshots (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      market_id   TEXT NOT NULL,
      yes_price   REAL NOT NULL,
      no_price    REAL NOT NULL,
      volume      REAL,
      recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- One row per bankroll type; seeded on first use
    CREATE TABLE IF NOT EXISTS bankroll (
      id                INTEGER PRIMARY KEY,
      trade_type        TEXT NOT NULL UNIQUE CHECK(trade_type IN ('paper','real')),
      starting_balance  REAL NOT NULL DEFAULT 1000.0,
      current_balance   REAL NOT NULL DEFAULT 1000.0,
      updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
    );

    INSERT OR IGNORE INTO bankroll (trade_type, starting_balance, current_balance)
    VALUES ('paper', 1000.0, 1000.0),
           ('real',  1000.0, 1000.0);

    -- Auto-trader settings (single row)
    CREATE TABLE IF NOT EXISTS autotrader_settings (
      id                      INTEGER PRIMARY KEY DEFAULT 1,
      enabled                 INTEGER NOT NULL DEFAULT 1,
      strategy                TEXT NOT NULL DEFAULT 'fade_extremes'
                                CHECK(strategy IN ('fade_extremes','volume_spike','both')),
      min_edge_score          INTEGER NOT NULL DEFAULT 55,
      max_open_positions      INTEGER NOT NULL DEFAULT 8,
      kelly_fraction          REAL    NOT NULL DEFAULT 0.25,
      max_position_pct        REAL    NOT NULL DEFAULT 0.05,
      fade_threshold_high     REAL    NOT NULL DEFAULT 0.80,
      fade_threshold_low      REAL    NOT NULL DEFAULT 0.20,
      regression_factor       REAL    NOT NULL DEFAULT 0.15,
      take_profit_pct         REAL    NOT NULL DEFAULT 0.40,
      stop_loss_pct           REAL    NOT NULL DEFAULT 0.35,
      min_days_to_resolution  REAL    NOT NULL DEFAULT 1.0,
      max_days_to_resolution  REAL    NOT NULL DEFAULT 30.0,
      updated_at              TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    INSERT OR IGNORE INTO autotrader_settings (id) VALUES (1);

    -- Auto-trader run log
    CREATE TABLE IF NOT EXISTS autotrader_runs (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      ran_at            TEXT NOT NULL DEFAULT (datetime('now')),
      markets_scanned   INTEGER NOT NULL DEFAULT 0,
      trades_opened     INTEGER NOT NULL DEFAULT 0,
      trades_closed     INTEGER NOT NULL DEFAULT 0,
      cash_deployed     REAL    NOT NULL DEFAULT 0.0,
      cash_returned     REAL    NOT NULL DEFAULT 0.0,
      settings_snapshot TEXT,
      decisions         TEXT    NOT NULL DEFAULT '[]'
    );

    CREATE INDEX IF NOT EXISTS idx_trades_market ON paper_trades(market_id);
    CREATE INDEX IF NOT EXISTS idx_trades_type   ON paper_trades(trade_type);
    CREATE INDEX IF NOT EXISTS idx_snapshots_market ON price_snapshots(market_id);
    CREATE INDEX IF NOT EXISTS idx_snapshots_time ON price_snapshots(recorded_at);
    CREATE INDEX IF NOT EXISTS idx_runs_time ON autotrader_runs(ran_at);
  `);

  // Add trade_type column to existing DBs that were created before this migration
  const cols = db.prepare("PRAGMA table_info(paper_trades)").all() as Array<{ name: string }>;
  if (!cols.find((c) => c.name === "trade_type")) {
    db.exec(`ALTER TABLE paper_trades ADD COLUMN trade_type TEXT NOT NULL DEFAULT 'paper'`);
  }
}
