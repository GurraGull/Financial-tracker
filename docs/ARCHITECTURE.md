# PM Terminal — Architecture

## System overview

```
Vercel (static)          Supabase                  Worker (planned)
┌──────────────┐         ┌──────────────────────┐  ┌─────────────────────┐
│  Next.js     │ ←─RLS─→ │  Postgres            │  │  Cron ingestion     │
│  static HTML │         │  positions           │  │  - secondary prices │
│  /           │         │  companies (planned) │  │  - valuation rounds │
│  /app        │         │  secondary_prices    │  │  - news articles    │
└──────────────┘         │  news_items          │  └─────────────────────┘
                         │  news_classifications│         │
                         │                      │ ←───────┘
                         │  Auth (email+pass)   │
                         │  RLS per user_id     │
                         └──────────────────────┘
```

## Static export constraint

`next.config.ts` sets `output: "export"`. This means:
- No server-side rendering, no API routes
- All data fetching is client-side (Supabase JS client) or build-time
- Vercel serves the `out/` directory as static files
- The ingestion worker will be a separate service, not part of this repo

## Secondary price computation

Currently: three fields on each company object (`forgePrice`, `hiivePrice`, `noticePrice`), median computed in the client.

When real data exists:
```sql
CREATE VIEW secondary_prices_blended AS
SELECT
  company_id,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) AS blended_price,
  MAX(updated_at) AS last_updated
FROM secondary_prices
WHERE source IN ('forge', 'hiive', 'notice')
  AND updated_at > NOW() - INTERVAL '7 days'
GROUP BY company_id;
```

## News-as-catalyst pipeline

Four steps — no AI output is auto-applied to production data.

```
1. INGEST
   Worker fetches news for each company (Google News RSS, Diffbot, or similar).
   Writes raw to news_items: { company_id, title, url, published_at, raw_text }

2. CLASSIFY
   Separate job calls Claude API on each unclassified item.
   Writes to news_classifications:
   { news_item_id, catalyst_type, sentiment, summary, confidence, model, classified_at }
   catalyst_type: 'valuation_round' | 'revenue_milestone' | 'leadership' | 'regulatory' | 'product' | 'other'

3. REVIEW QUEUE
   Admin UI (future) shows classifications with confidence < threshold or catalyst_type = 'valuation_round'.
   Admin approves, rejects, or corrects.

4. APPLY
   On approval, if catalyst_type = 'valuation_round': update companies.current_valuation_m.
   Show approved items with classification labels in IntelligencePanel.
   Never auto-apply step 2 output directly to companies table.
```

## Position value calculation

Lives in `src/lib/positions.ts → derivePosition()`.

```
currSharePrice = (currentValuationM / entryValuationM) * entrySharePrice
currentValue   = shares × currSharePrice
costBasis      = shares × entrySharePrice
unrealizedPL   = currentValue − costBasis
multiple       = currentValue / costBasis
allocation     = currentValue / portfolioTotal
annualizedRet  = multiple^(365/daysSinceEntry) − 1
```

Secondary value uses `secondaryValuationM` in place of `currentValuationM` — this lets users see the delta between paper valuation and where the secondary market is actually trading.

## Auth flow

```
User visits /app
  ↓
Shell mounts → getSupabase().auth.getSession()
  ↓ no session
AuthModal shown (sign in / sign up)
  ↓ on success
Shell loads positions from Supabase (dbLoad)
  ↓ no positions
DEMO_POSITIONS shown with "add your own" prompt (planned)
```

Fallback: if Supabase env vars absent, Shell uses localStorage. Useful for local dev without credentials.

## File structure

```
src/
  app/
    page.tsx          ← public landing page
    app/page.tsx      ← Portfolio Terminal (Shell)
    layout.tsx
    globals.css       ← all CSS, pm- prefix
  components/
    Shell.tsx         ← main client component, owns all state
    SummaryStrip.tsx
    PositionsTable.tsx
    CardsView.tsx
    SidePanel.tsx
    IntelligencePanel.tsx
    AddPositionModal.tsx
    AuthModal.tsx
  lib/
    companies.ts      ← closed company list, single source of truth
    positions.ts      ← StoredPosition, DerivedPosition, derivePosition, formatters
    db.ts             ← Supabase CRUD (dbLoad, dbUpsert, dbDelete)
    supabase.ts       ← client singleton, graceful fallback
docs/
  SPEC.md
  ARCHITECTURE.md
  ROADMAP.md
CLAUDE.md
.env.example
```
