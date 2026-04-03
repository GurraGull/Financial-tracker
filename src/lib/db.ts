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

    CREATE INDEX IF NOT EXISTS idx_trades_market ON paper_trades(market_id);
    CREATE INDEX IF NOT EXISTS idx_trades_type   ON paper_trades(trade_type);
    CREATE INDEX IF NOT EXISTS idx_snapshots_market ON price_snapshots(market_id);
    CREATE INDEX IF NOT EXISTS idx_snapshots_time ON price_snapshots(recorded_at);
  `);

  // Add trade_type column to existing DBs that were created before this migration
  const cols = db.prepare("PRAGMA table_info(paper_trades)").all() as Array<{ name: string }>;
  if (!cols.find((c) => c.name === "trade_type")) {
    db.exec(`ALTER TABLE paper_trades ADD COLUMN trade_type TEXT NOT NULL DEFAULT 'paper'`);
  }
}
