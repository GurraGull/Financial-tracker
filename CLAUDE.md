# PM Terminal

See `docs/SPEC.md` for product scope. See `docs/ROADMAP.md` for current stage.

## Stack

- **Frontend**: Next.js 16 App Router, static export (`output: "export"`), deployed on Vercel
- **Auth + DB**: Supabase — Postgres with RLS, email/password auth
- **Language**: TypeScript strict mode throughout
- **Styling**: Tailwind CSS v4 + custom CSS properties in `globals.css` (terminal dark theme, `pm-` prefix)
- **Data ingestion**: planned as a separate cron worker (Railway or Fly) — not in this repo yet

## Routes

- `/` — public landing page (`src/app/page.tsx`)
- `/app` — Portfolio Terminal, requires auth (`src/app/app/page.tsx` → `Shell`)

## Key architectural decisions

- **Closed company list** — users pick from `src/lib/companies.ts`, never free-text. Adding a company is an admin action.
- **Secondary price** = median of Forge / Hiive / Notice. Computed in the client from three stored price fields. When a real ingestion worker exists, it writes to `secondary_prices` table; a DB view computes the median.
- **News pipeline**: ingest → Claude classifies → admin review queue → manual approval → write to `companies` table. Never auto-apply AI output to production data.
- **Community page**: aggregate stats only. No query path exposes individual user holdings.
- **Static export constraint**: no Next.js API routes, no SSR. All data fetching is client-side or build-time. Intelligence panel uses rss2json public API for news.

## Conventions

- Server components by default; add `'use client'` only when needed (state, effects, event handlers)
- Migrations via Supabase CLI (`supabase/migrations/`), never hand-edited in the dashboard
- Shared types in `src/lib/` — `companies.ts`, `positions.ts`, `db.ts`
- No comments unless the WHY is non-obvious
- `fmtM`, `fmtK`, `fmtPct`, `fmtX`, `fmtDays` formatters live in `src/lib/positions.ts` — reuse them
- CSS class names: all `pm-` prefixed, defined in `src/app/globals.css`

## Environment

See `.env.example` for all required variables. The app works without Supabase (localStorage fallback) but auth and multi-device sync require it.
