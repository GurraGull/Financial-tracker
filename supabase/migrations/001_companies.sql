-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)
-- Creates companies + secondary_prices tables, RLS, blended view, and seeds 13 companies.

-- ── 1. COMPANIES TABLE ────────────────────────────────────────────────────────
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
  arr_m               numeric,
  forge_price         numeric,
  hiive_price         numeric,
  notice_price        numeric,
  domain              text NOT NULL DEFAULT '',
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companies_public_read" ON public.companies
  FOR SELECT USING (true);

CREATE POLICY "companies_auth_write" ON public.companies
  FOR ALL
  USING  (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ── 2. SECONDARY PRICES TABLE ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.secondary_prices (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id  text NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  source      text NOT NULL CHECK (source IN ('forge', 'hiive', 'notice')),
  price       numeric NOT NULL,
  notes       text NOT NULL DEFAULT '',
  recorded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.secondary_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "secondary_prices_public_read" ON public.secondary_prices
  FOR SELECT USING (true);

CREATE POLICY "secondary_prices_auth_write" ON public.secondary_prices
  FOR ALL
  USING  (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ── 3. BLENDED PRICE VIEW ─────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.secondary_prices_blended AS
SELECT
  company_id,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) AS blended_price,
  MAX(recorded_at) AS last_updated
FROM public.secondary_prices
WHERE recorded_at > NOW() - INTERVAL '30 days'
GROUP BY company_id;

-- ── 4. SEED ───────────────────────────────────────────────────────────────────
INSERT INTO public.companies
  (id, name, ticker, sector, color, current_valuation_m, last_round_date, stage, description, arr_m, forge_price, hiive_price, notice_price, domain)
VALUES
  ('anthropic',  'Anthropic',     'ANTH',    'AI Safety',           '#FF6B35', 900000, '2026-04-29', 'Pre-IPO',   'AI safety company behind Claude.',    NULL, NULL, NULL, NULL, 'anthropic.com'),
  ('spacex',     'SpaceX',        'SPACEX',  'Aerospace',           '#3B82F6', 350000, '2024-12-01', 'Pre-IPO',   'Reusable rockets, Starlink, Mars.',   NULL, NULL, NULL, NULL, 'spacex.com'),
  ('openai',     'OpenAI',        'OPENAI',  'AI Foundation',       '#10B981', 300000, '2025-10-01', 'Pre-IPO',   'GPT, DALL-E, Sora creator.',          NULL, NULL, NULL, NULL, 'openai.com'),
  ('stripe',     'Stripe',        'STRIPE',  'Fintech',             '#635BFF', 70000,  '2023-03-15', 'Pre-IPO',   'Global payments infrastructure.',     NULL, NULL, NULL, NULL, 'stripe.com'),
  ('databricks', 'Databricks',    'DBX',     'Data & AI',           '#8B5CF6', 62000,  '2024-12-17', 'Series J',  'Unified data analytics platform.',    NULL, NULL, NULL, NULL, 'databricks.com'),
  ('revolut',    'Revolut',       'RVLT',    'Fintech',             '#0075EB', 45000,  '2024-08-16', 'Series E+', 'Global neobank and super-app.',       NULL, NULL, NULL, NULL, 'revolut.com'),
  ('waymo',      'Waymo',         'WAYMO',   'Autonomous Vehicles', '#4285F4', 45000,  '2024-10-25', 'Pre-IPO',   'Autonomous ride-hailing.',            NULL, NULL, NULL, NULL, 'waymo.com'),
  ('epic-games', 'Epic Games',    'EPIC',    'Gaming',              '#0078F2', 31500,  '2022-04-11', 'Pre-IPO',   'Fortnite and Unreal Engine.',         NULL, NULL, NULL, NULL, 'epicgames.com'),
  ('anduril',    'Anduril',       'ANDRL',   'Defense Tech',        '#EF4444', 28000,  '2024-08-01', 'Series F',  'AI-powered defense systems.',         NULL, NULL, NULL, NULL, 'anduril.com'),
  ('canva',      'Canva',         'CANVA',   'Design Tools',        '#00C4CC', 26000,  '2021-09-01', 'Pre-IPO',   'Visual content creation platform.',   NULL, NULL, NULL, NULL, 'canva.com'),
  ('discord',    'Discord',       'DISCORD', 'Social / Gaming',     '#5865F2', 15000,  '2021-09-01', 'Pre-IPO',   'Community and voice platform.',       NULL, NULL, NULL, NULL, 'discord.com'),
  ('perplexity', 'Perplexity AI', 'PRPLX',   'AI Search',           '#20B2AA', 9000,   '2025-01-01', 'Series C',  'AI-powered search engine.',           NULL, NULL, NULL, NULL, 'perplexity.ai'),
  ('mistral',    'Mistral AI',    'MSTRL',   'AI Foundation',       '#FF7D1A', 6200,   '2024-06-11', 'Series B',  'Open-weight AI models.',              NULL, NULL, NULL, NULL, 'mistral.ai')
ON CONFLICT (id) DO UPDATE SET
  current_valuation_m = EXCLUDED.current_valuation_m,
  last_round_date     = EXCLUDED.last_round_date,
  stage               = EXCLUDED.stage,
  arr_m               = EXCLUDED.arr_m,
  forge_price         = EXCLUDED.forge_price,
  hiive_price         = EXCLUDED.hiive_price,
  notice_price        = EXCLUDED.notice_price,
  updated_at          = now();
