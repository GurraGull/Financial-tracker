-- Enable Supabase Realtime broadcasts for live price/valuation updates.
-- Run this in the Supabase SQL editor (or via supabase db push).

ALTER PUBLICATION supabase_realtime ADD TABLE public.companies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.secondary_prices;
