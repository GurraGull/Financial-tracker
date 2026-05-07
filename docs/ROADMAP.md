# PM Terminal — Build Roadmap

Start each Claude Code session with: "I'm on Stage N. Today's goal: [one task from the checklist]."

---

## Stage 1 — Foundation ✅ DONE

- [x] Next.js App Router, static export, Vercel deploy
- [x] Supabase auth (email/password) with RLS
- [x] Position CRUD — add, edit, delete
- [x] Portfolio calculations (cost basis, P&L, MOIC, annualized return, allocation)
- [x] Company universe — 27 companies, hardcoded with ARR + secondary price estimates
- [x] Summary strip, table view, cards view, side panel
- [x] Intelligence panel (Google News RSS via rss2json)
- [x] Public landing page — hero, feature overview, company table, CTA
- [x] Mobile responsive layout

---

## Stage 2 — Portfolio polish 🔄 CURRENT

- [x] CSV export
- [x] Password reset flow (email link via Supabase)
- [x] Empty state / onboarding for new users (no demo positions)
- [ ] Company logos (favicon/logo per company, served from `/public/logos/`)
- [ ] Tooltips on financial metrics (MOIC, annualized return, secondary value)
- [ ] Sort + filter on landing page company table (by sector, stage, valuation)

---

## Stage 3 — Real data ingestion

- [x] Supabase `companies` table
- [x] Supabase `secondary_prices` table + blended price view
- [x] Company import staging SQL + research notes import path
- [ ] Ingestion worker skeleton (separate repo or `/worker` package): cron-triggered, fetches secondary prices from Forge/Hiive/Notice scrape or API
- [x] Admin editing for company valuation and secondary prices
- [x] `updated_at` timestamps shown on landing page ("prices as of…")

---

## Stage 4 — News intelligence pipeline

- [x] `news_items` table
- [x] Manual admin news management
- [x] IntelligencePanel reads stored `news_items`
- [x] `news_classifications` + `news_ingestion_runs` schema
- [ ] Ingestion job: fetch articles per company, write to `news_items`
- [ ] Classification job: call model per article, write to `news_classifications`
- [ ] Admin review UI: approve / reject / correct classifications
- [ ] IntelligencePanel: show approved articles with catalyst type labels
- [ ] Valuation-round catalyst: on admin approval, prompt to update `companies.current_valuation_m`

---

## Stage 5 — Sharing + alerts

- [ ] Read-only portfolio share link (public token, shows positions without user identity)
- [ ] Valuation alert: notify user when a company's valuation changes by >X%
- [ ] Email digest: weekly portfolio summary (Supabase Edge Function + Resend)

---

## Stage 6 — Community (aggregate only)

- [ ] Aggregate stats page: "X% of PM Terminal users hold Anthropic" — no individual holdings exposed
- [ ] Trending companies: which companies are most held / fastest growing by AUM on the platform
- [ ] No query path ever returns holdings for a specific user to another user

---

## Stage 7 — Growth

- [ ] Custom domain
- [ ] SEO: `og:image` per company, meta descriptions
- [ ] Pricing: free tier (read-only universe), paid tier (portfolio tracking + alerts + intelligence)
- [ ] Waitlist / referral flow
- [ ] Privacy policy + terms of service
