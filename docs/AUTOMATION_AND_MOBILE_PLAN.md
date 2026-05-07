# PM Terminal — Automation And Mobile Plan

## Goal

Make PM Terminal publishable as:

- a reliable web app with real company data
- a managed news pipeline that does not depend on browser scraping
- a mobile-friendly experience that can become an iPhone app

## Current Audit

### Core that now exists

- DB-backed company list
- DB-backed positions
- persisted news items
- admin company editing
- admin manual news editing
- working Vercel branch and Supabase setup path

### Highest-impact remaining gaps

1. No automated news ingestion yet
2. No news classification/review workflow yet
3. Admin access is "any authenticated user", not true role-based admin
4. No company detail page
5. Docs still describe older static-export assumptions
6. No mobile/PWA install path yet

## News Automation Plan

### Recommended production shape

Use three layers:

1. `news_items`
   Raw or lightly normalized articles stored in Supabase
2. `news_classifications`
   LLM output plus admin review status
3. `news_ingestion_runs`
   Operational log for each ingestion/classification run

This keeps AI output separate from live company metrics.

### Job 1: News ingest cron

Purpose:

- fetch recent articles for tracked companies
- dedupe by URL + title
- write/update `news_items`

Recommended schedule:

- every 6 hours for beta: `0 */6 * * *`

Vercel pattern:

- production cron triggers a GET route on your app
- protect it with `CRON_SECRET`
- do not rely on redirects
- use a lock if overlap is possible

### Job 2: Classification queue

Purpose:

- take unclassified `news_items`
- run model classification
- write to `news_classifications`

Output fields:

- `catalyst_type`
- `sentiment`
- `summary`
- `confidence`
- `model`
- `status = pending`

Recommended schedule:

- every 15 minutes for beta: `*/15 * * * *`

### Job 3: Admin review queue

Purpose:

- approve/reject/correct classifications
- only approved items appear as trusted app intelligence
- valuation-related items can later prompt a company metric update

### Job 4: Daily health check

Purpose:

- report stale companies
- detect zero-news periods
- detect failed ingestion runs

Recommended schedule:

- daily: `0 7 * * *`

## When To Use Vercel Cron vs Workflow

Use Vercel Cron when:

- the job is short
- the work can finish within normal function limits
- you are polling on a fixed schedule

Use Vercel Workflow when:

- one run fans out across many companies/articles
- the job may exceed function duration
- you need retries, resumability, or long-running orchestration

Recommended PM Terminal split:

- Cron triggers ingestion entrypoints
- Workflow handles multi-step classification and retry-heavy runs

## Agent Plan

These are the useful agents for PM Terminal.

### 1. News ingestion agent

Responsibility:

- fetch articles per company
- normalize source/title/date/link
- write `news_items`

This is not a chat agent. It is a background worker.

### 2. News classification agent

Responsibility:

- read unclassified `news_items`
- assign catalyst type and sentiment
- generate a short summary
- write `news_classifications`

Guardrail:

- never auto-update company valuations directly

### 3. Admin research copilot

Responsibility:

- help you summarize company changes
- draft better descriptions
- suggest stage/confidence changes
- explain why a company mark looks stale

This is a UI assistant for admins, not an autonomous writer to production tables.

### 4. Portfolio explainer agent

Responsibility:

- explain cost basis, gross gain, net value, carry drag
- answer "why did this position move?"

Useful in product later, but not core beta.

### 5. Support/search agent

Responsibility:

- answer user help questions
- search internal docs or public company notes

Lower priority than ingestion and admin workflows.

## Can You Use Agents To Update The Site?

Yes, but in controlled ways.

Safe:

- classify news into draft tables
- summarize articles
- draft admin suggestions
- suggest valuation updates

Unsafe:

- directly overwrite company valuation anchors without approval
- publish news automatically without review
- edit user positions

Recommended rule:

- agents can write drafts
- humans approve anything that changes trusted market data

## Agent Upload Contract

PM Terminal now has a secure draft-ingest endpoint:

- `POST /api/agent/news-ingest`

Authentication:

- send `Authorization: Bearer <AGENT_NEWS_INGEST_TOKEN>`

Required server env:

- `SUPABASE_SERVICE_ROLE_KEY`
- `AGENT_NEWS_INGEST_TOKEN`

### Single item payload

```json
{
  "company_id": "anthropic",
  "title": "Anthropic discussing new financing at higher valuation",
  "link": "https://example.com/article",
  "source": "Financial Times",
  "summary": "Anthropic is reportedly discussing a new financing round at a higher implied valuation.",
  "tag": "valuation",
  "published_at": "2026-05-07T08:30:00Z",
  "external_id": "ft-anthropic-2026-05-07",
  "submitted_by": "chatgpt-agent"
}
```

### Batch payload

```json
{
  "items": [
    {
      "company_id": "anthropic",
      "title": "Anthropic discussing new financing at higher valuation",
      "link": "https://example.com/article",
      "source": "Financial Times",
      "summary": "Anthropic is reportedly discussing a new financing round at a higher implied valuation.",
      "tag": "valuation",
      "published_at": "2026-05-07T08:30:00Z",
      "external_id": "ft-anthropic-2026-05-07",
      "submitted_by": "chatgpt-agent"
    }
  ]
}
```

Behavior:

- inserts as draft with `is_published = false`
- sets `submission_source = 'agent'`
- dedupes on `external_id` when present
- otherwise dedupes on `company_id + link`
- rejects unknown `company_id`

Review flow:

- agent submits draft
- admin sees it in News Manager
- admin edits/approves by setting `Published`
- only published items appear in the live intelligence feed

## iPhone App Path

### Phase 1: PWA first

This is the fastest path to an iPhone-friendly app.

Needed:

- `app/manifest.ts`
- installable icon set
- Apple touch icons
- service worker
- standalone display mode
- mobile-safe auth and forms
- bottom navigation for `/app`
- safe-area padding for iPhone

Result:

- users can add to Home Screen on iPhone
- one codebase
- no App Store review required

### Phase 2: Mobile UX polish

Needed:

- larger tap targets
- fixed bottom nav
- less dense tables
- card-first portfolio on small screens
- better keyboard handling in modals/forms
- faster loading states
- lower-motion transitions

### Phase 3: Native wrapper or native app

Choose this only if you need:

- App Store distribution
- native push beyond PWA scope
- deeper device integrations
- smoother native navigation patterns

Two realistic paths:

- Capacitor wrapper around the web app
- React Native / Expo app using Supabase and a shared backend

Recommendation:

- do PWA first
- postpone native build until you have real beta usage

## Next Build Order

1. Finish company import into Supabase
2. Add role-based admin gating
3. Add `news_classifications` review UI
4. Add server-side/news cron entrypoint
5. Add ingest run logging and retry visibility
6. Add `manifest.ts`, icons, and mobile install polish
7. Add company detail page

## References

- Vercel Cron Jobs: https://vercel.com/docs/cron-jobs
- Managing Vercel Cron Jobs: https://vercel.com/docs/cron-jobs/manage-cron-jobs
- Vercel Workflow: https://vercel.com/docs/workflow
- Next.js PWAs: https://nextjs.org/docs/app/guides/progressive-web-apps
- Next.js Deploying: https://nextjs.org/docs/app/getting-started/deploying
