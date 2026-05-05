-- PM Terminal MVP positions schema.
-- Safe to run after older prototype schemas. It upgrades the existing
-- positions table if present and backfills the new fields from legacy columns.

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
