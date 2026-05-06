-- PM Terminal beta setup
--
-- Run this once in Supabase SQL Editor. It is designed to be idempotent:
-- you can re-run it without breaking on existing tables or policies.
--
-- It creates/updates:
-- - companies
-- - secondary_prices
-- - positions
-- - news_items
-- - company_research_notes
-- - staging_companies_import
-- - staging_company_research_notes

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── COMPANIES ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.companies (
  id                  text PRIMARY KEY,
  name                text NOT NULL,
  ticker              text NOT NULL,
  sector              text NOT NULL,
  color               text NOT NULL DEFAULT '#6366F1',
  current_valuation_m numeric NOT NULL DEFAULT 0,
  last_round_date     text NOT NULL DEFAULT '',
  stage               text NOT NULL DEFAULT 'Pre-IPO',
  description         text NOT NULL DEFAULT '',
  arr_m               numeric NOT NULL DEFAULT 0,
  forge_price         numeric NOT NULL DEFAULT 0,
  hiive_price         numeric NOT NULL DEFAULT 0,
  notice_price        numeric NOT NULL DEFAULT 0,
  domain              text NOT NULL DEFAULT '',
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "companies_public_read" ON public.companies;
DROP POLICY IF EXISTS "companies_auth_write" ON public.companies;

CREATE POLICY "companies_public_read" ON public.companies
  FOR SELECT USING (true);

CREATE POLICY "companies_auth_write" ON public.companies
  FOR ALL
  USING  (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ── SECONDARY PRICES ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.secondary_prices (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id  text NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  source      text NOT NULL CHECK (source IN ('forge', 'hiive', 'notice')),
  price       numeric NOT NULL,
  notes       text NOT NULL DEFAULT '',
  recorded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.secondary_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "secondary_prices_public_read" ON public.secondary_prices;
DROP POLICY IF EXISTS "secondary_prices_auth_write" ON public.secondary_prices;

CREATE POLICY "secondary_prices_public_read" ON public.secondary_prices
  FOR SELECT USING (true);

CREATE POLICY "secondary_prices_auth_write" ON public.secondary_prices
  FOR ALL
  USING  (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE OR REPLACE VIEW public.secondary_prices_blended AS
SELECT
  company_id,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) AS blended_price,
  MAX(recorded_at) AS last_updated
FROM public.secondary_prices
WHERE recorded_at > NOW() - INTERVAL '30 days'
GROUP BY company_id;

-- ── POSITIONS ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.positions (
  id                           text PRIMARY KEY,
  user_id                      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id                   text NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  holding_type                 text NOT NULL DEFAULT 'direct',
  investment_amount            numeric NOT NULL DEFAULT 0,
  currency                     text NOT NULL DEFAULT 'USD',
  purchase_date                text NOT NULL DEFAULT '',
  entry_valuation_m            numeric NOT NULL DEFAULT 0,
  shares                       numeric,
  cost_per_share               numeric,
  vehicle_name                 text NOT NULL DEFAULT '',
  carry_pct                    numeric NOT NULL DEFAULT 0,
  annual_management_fee_pct    numeric NOT NULL DEFAULT 0,
  one_time_admin_fee           numeric NOT NULL DEFAULT 0,
  notes                        text NOT NULL DEFAULT '',
  include_in_community_stats   boolean NOT NULL DEFAULT false,
  created_at                   timestamptz NOT NULL DEFAULT now(),
  updated_at                   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.positions
  ADD COLUMN IF NOT EXISTS holding_type text NOT NULL DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS investment_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS purchase_date text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS cost_per_share numeric,
  ADD COLUMN IF NOT EXISTS vehicle_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS carry_pct numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS annual_management_fee_pct numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS one_time_admin_fee numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS include_in_community_stats boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'positions'
      AND column_name = 'entry_share_price'
  ) THEN
    UPDATE public.positions
    SET
      investment_amount = CASE
        WHEN COALESCE(investment_amount, 0) = 0 AND shares IS NOT NULL AND entry_share_price IS NOT NULL
          THEN shares * entry_share_price
        ELSE investment_amount
      END,
      cost_per_share = COALESCE(cost_per_share, entry_share_price),
      purchase_date = CASE
        WHEN purchase_date = '' THEN COALESCE(entry_date, '')
        ELSE purchase_date
      END
    WHERE true;
  END IF;
END $$;

ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "positions_select_own" ON public.positions;
DROP POLICY IF EXISTS "positions_insert_own" ON public.positions;
DROP POLICY IF EXISTS "positions_update_own" ON public.positions;
DROP POLICY IF EXISTS "positions_delete_own" ON public.positions;

CREATE POLICY "positions_select_own" ON public.positions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "positions_insert_own" ON public.positions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "positions_update_own" ON public.positions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "positions_delete_own" ON public.positions
  FOR DELETE USING (auth.uid() = user_id);

-- ── NEWS ITEMS ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.news_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  link text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  tag text NOT NULL DEFAULT 'general',
  published_at timestamptz NOT NULL DEFAULT now(),
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS news_items_company_id_idx ON public.news_items(company_id);
CREATE INDEX IF NOT EXISTS news_items_published_at_idx ON public.news_items(published_at DESC);

ALTER TABLE public.news_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "news_items_public_read" ON public.news_items;
DROP POLICY IF EXISTS "news_items_auth_write" ON public.news_items;

CREATE POLICY "news_items_public_read" ON public.news_items
  FOR SELECT USING (is_published = true);

CREATE POLICY "news_items_auth_write" ON public.news_items
  FOR ALL
  USING  (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ── RESEARCH NOTES ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.company_research_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  primary_anchor_text text NOT NULL DEFAULT '',
  secondary_mark_text text NOT NULL DEFAULT '',
  revenue_text text NOT NULL DEFAULT '',
  stage_notes text NOT NULL DEFAULT '',
  source_1 text NOT NULL DEFAULT '',
  source_2 text NOT NULL DEFAULT '',
  source_3 text NOT NULL DEFAULT '',
  confidence text NOT NULL DEFAULT 'medium',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_research_notes_confidence_check CHECK (confidence IN ('high', 'medium', 'low'))
);

ALTER TABLE public.company_research_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company_research_notes_public_read" ON public.company_research_notes;
DROP POLICY IF EXISTS "company_research_notes_auth_write" ON public.company_research_notes;

CREATE POLICY "company_research_notes_public_read" ON public.company_research_notes
  FOR SELECT USING (true);

CREATE POLICY "company_research_notes_auth_write" ON public.company_research_notes
  FOR ALL
  USING  (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ── STAGING TABLES FOR CSV IMPORT ────────────────────────────────────────────

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

COMMIT;

-- After running this:
-- 1. Import CSV into public.staging_companies_import
-- 2. Import CSV into public.staging_company_research_notes
-- 3. Run supabase/imports/companies_and_notes_import.sql
