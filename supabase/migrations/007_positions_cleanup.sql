-- Clean up legacy PM Terminal positions schema after backfill.
-- Safe to run once the MVP fields exist. Drops old prototype columns and
-- removes the duplicate legacy policy name if present.

ALTER TABLE public.positions
  DROP COLUMN IF EXISTS entry_share_price,
  DROP COLUMN IF EXISTS current_valuation_m,
  DROP COLUMN IF EXISTS secondary_valuation_m,
  DROP COLUMN IF EXISTS entry_date;

DROP POLICY IF EXISTS "Users manage own positions" ON public.positions;
