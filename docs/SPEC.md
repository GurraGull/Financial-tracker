# PM Terminal — Product Spec

## What it is

PM Terminal is a private markets intelligence platform. It tracks pre-IPO companies — their valuations, ARR, and secondary market share prices — and lets users log their personal holdings to see their portfolio in real-time.

The core value proposition: private market data is fragmented and opaque. PM Terminal aggregates it into a single terminal-style interface that updates as rounds close, secondary trades clear, and news breaks.

## User types

- **Visitor** — unauthenticated, views the public landing page with company universe
- **Investor** — authenticated, manages their personal portfolio in the `/app` terminal
- **Admin** — internal, reviews news classification queue and approves data updates (future)

## Core features

### Company universe (public)
- Fixed list of ~30 pre-IPO companies, curated by PM Terminal
- Each company: name, sector, stage, last round date, valuation, ARR, secondary market prices
- Users cannot add companies — this is an admin action. Closed list is the key quality control.

### Portfolio terminal (authenticated)
- Add / edit / remove positions: company, shares, entry price, entry valuation, entry date, notes
- Derived metrics per position: current share price, cost basis, current value, unrealized P&L, MOIC, annualized return, portfolio allocation %
- Summary strip: total cost, total current value, total secondary value, total P&L, average multiple, gainers count
- Views: table (sortable), cards, intelligence (news feed)

### Secondary market pricing
- Three sources: Forge Global, Hiive, Notice
- Blended price = median of the three (not average — median is more robust to outliers)
- Displayed per company on the landing page and within each position card
- Future: real ingestion worker updates prices; currently hardcoded estimates

### News intelligence
- Per-company news feed, currently from Google News RSS via rss2json
- Future: structured pipeline — ingest → Claude classifies sentiment/catalyst type → admin reviews → approved items shown with classification labels

## Data model (current)

### `positions` table (Supabase)
```
id                  text primary key
user_id             uuid → auth.users
company_id          text (matches COMPANIES[].id)
shares              numeric
entry_share_price   numeric
entry_valuation_m   numeric
current_valuation_m numeric
secondary_valuation_m numeric
entry_date          text
notes               text
created_at          timestamptz
```
RLS: users can only read/write their own rows.

### Planned tables
- `companies` — persisted company data (currently hardcoded in `companies.ts`)
- `secondary_prices` — one row per company per source per date
- `news_items` — raw ingested articles
- `news_classifications` — Claude output + admin approval status

## What PM Terminal is not

- Not a broker — no ability to execute trades
- Not a news aggregator — news is a signal, not the product
- Not a community platform — no social features, no comparing portfolios
- Not real-time — prices update on a cron schedule, not via websocket feeds
