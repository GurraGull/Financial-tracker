-- PM Terminal import workflow
--
-- Use this after the schema migrations are in place:
--   001_companies.sql
--   002_positions_mvp.sql
--   003_news_items.sql
--   004_company_research_notes.sql
--
-- Recommended flow:
-- 1. Create/populate the two staging tables below.
-- 2. In Supabase Table Editor, use "Import data from CSV" on each staging table.
-- 3. Run the UPSERT statements at the bottom.

BEGIN;

-- ── 1. STAGING TABLES ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.staging_companies_import (
  id text,
  name text,
  ticker text,
  sector text,
  stage text,
  description text,
  domain text,
  current_valuation_m numeric,
  last_round_date text,
  arr_m numeric,
  forge_price numeric,
  hiive_price numeric,
  notice_price numeric,
  color text
);

CREATE TABLE IF NOT EXISTS public.staging_company_research_notes (
  company_id text,
  primary_anchor_text text,
  secondary_mark_text text,
  revenue_text text,
  stage_notes text,
  source_1 text,
  source_2 text,
  source_3 text,
  confidence text,
  notes text
);

-- Optional reset before a fresh CSV import:
-- TRUNCATE public.staging_companies_import;
-- TRUNCATE public.staging_company_research_notes;

-- ── 2. UPSERT COMPANIES ──────────────────────────────────────────────────────

INSERT INTO public.companies (
  id,
  name,
  ticker,
  sector,
  color,
  current_valuation_m,
  last_round_date,
  stage,
  description,
  arr_m,
  forge_price,
  hiive_price,
  notice_price,
  domain,
  updated_at
)
SELECT
  trim(id) AS id,
  trim(name) AS name,
  upper(trim(ticker)) AS ticker,
  COALESCE(NULLIF(trim(sector), ''), 'Other') AS sector,
  COALESCE(NULLIF(trim(color), ''), '#6366F1') AS color,
  COALESCE(current_valuation_m, 0) AS current_valuation_m,
  COALESCE(NULLIF(trim(last_round_date), ''), '') AS last_round_date,
  COALESCE(NULLIF(trim(stage), ''), 'Pre-IPO') AS stage,
  COALESCE(NULLIF(trim(description), ''), '') AS description,
  COALESCE(arr_m, 0) AS arr_m,
  COALESCE(forge_price, 0) AS forge_price,
  COALESCE(hiive_price, 0) AS hiive_price,
  COALESCE(notice_price, 0) AS notice_price,
  COALESCE(NULLIF(trim(domain), ''), '') AS domain,
  now() AS updated_at
FROM public.staging_companies_import
WHERE COALESCE(NULLIF(trim(id), ''), '') <> ''
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  ticker = EXCLUDED.ticker,
  sector = EXCLUDED.sector,
  color = EXCLUDED.color,
  current_valuation_m = EXCLUDED.current_valuation_m,
  last_round_date = EXCLUDED.last_round_date,
  stage = EXCLUDED.stage,
  description = EXCLUDED.description,
  arr_m = EXCLUDED.arr_m,
  forge_price = EXCLUDED.forge_price,
  hiive_price = EXCLUDED.hiive_price,
  notice_price = EXCLUDED.notice_price,
  domain = EXCLUDED.domain,
  updated_at = now();

-- ── 3. UPSERT RESEARCH NOTES ─────────────────────────────────────────────────

INSERT INTO public.company_research_notes (
  company_id,
  primary_anchor_text,
  secondary_mark_text,
  revenue_text,
  stage_notes,
  source_1,
  source_2,
  source_3,
  confidence,
  notes,
  updated_at
)
SELECT
  trim(company_id) AS company_id,
  COALESCE(primary_anchor_text, '') AS primary_anchor_text,
  COALESCE(secondary_mark_text, '') AS secondary_mark_text,
  COALESCE(revenue_text, '') AS revenue_text,
  COALESCE(stage_notes, '') AS stage_notes,
  COALESCE(source_1, '') AS source_1,
  COALESCE(source_2, '') AS source_2,
  COALESCE(source_3, '') AS source_3,
  CASE
    WHEN lower(trim(confidence)) IN ('high', 'medium', 'low') THEN lower(trim(confidence))
    ELSE 'medium'
  END AS confidence,
  COALESCE(notes, '') AS notes,
  now() AS updated_at
FROM public.staging_company_research_notes
WHERE COALESCE(NULLIF(trim(company_id), ''), '') <> ''
ON CONFLICT (company_id) DO UPDATE SET
  primary_anchor_text = EXCLUDED.primary_anchor_text,
  secondary_mark_text = EXCLUDED.secondary_mark_text,
  revenue_text = EXCLUDED.revenue_text,
  stage_notes = EXCLUDED.stage_notes,
  source_1 = EXCLUDED.source_1,
  source_2 = EXCLUDED.source_2,
  source_3 = EXCLUDED.source_3,
  confidence = EXCLUDED.confidence,
  notes = EXCLUDED.notes,
  updated_at = now();

COMMIT;

-- ── 4. VERIFY ────────────────────────────────────────────────────────────────
--
-- SELECT count(*) FROM public.companies;
-- SELECT count(*) FROM public.company_research_notes;
-- SELECT id, name, current_valuation_m, arr_m FROM public.companies ORDER BY current_valuation_m DESC;
-- SELECT company_id, confidence FROM public.company_research_notes ORDER BY company_id;
