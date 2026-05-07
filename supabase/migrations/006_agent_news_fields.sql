ALTER TABLE public.news_items
  ADD COLUMN IF NOT EXISTS submission_source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS submitted_by text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS external_id text NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS news_items_external_id_idx
  ON public.news_items(external_id);
