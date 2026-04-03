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

    CREATE INDEX IF NOT EXISTS idx_trades_market ON paper_trades(market_id);
    CREATE INDEX IF NOT EXISTS idx_snapshots_market ON price_snapshots(market_id);
    CREATE INDEX IF NOT EXISTS idx_snapshots_time ON price_snapshots(recorded_at);
  `);
}
