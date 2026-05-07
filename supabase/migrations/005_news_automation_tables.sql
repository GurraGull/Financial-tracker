CREATE TABLE IF NOT EXISTS public.news_classifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  news_item_id uuid NOT NULL UNIQUE REFERENCES public.news_items(id) ON DELETE CASCADE,
  catalyst_type text NOT NULL DEFAULT 'other',
  sentiment text NOT NULL DEFAULT 'neutral',
  summary text NOT NULL DEFAULT '',
  confidence numeric NOT NULL DEFAULT 0,
  model text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  admin_notes text NOT NULL DEFAULT '',
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT news_classifications_catalyst_check CHECK (
    catalyst_type IN ('valuation_round', 'revenue_milestone', 'leadership', 'regulatory', 'product', 'secondary', 'general', 'other')
  ),
  CONSTRAINT news_classifications_sentiment_check CHECK (
    sentiment IN ('positive', 'neutral', 'negative', 'mixed')
  ),
  CONSTRAINT news_classifications_status_check CHECK (
    status IN ('pending', 'approved', 'rejected', 'corrected')
  )
);

CREATE INDEX IF NOT EXISTS news_classifications_status_idx
  ON public.news_classifications(status);

ALTER TABLE public.news_classifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "news_classifications_public_read" ON public.news_classifications;
DROP POLICY IF EXISTS "news_classifications_auth_write" ON public.news_classifications;

CREATE POLICY "news_classifications_public_read" ON public.news_classifications
  FOR SELECT USING (status = 'approved');

CREATE POLICY "news_classifications_auth_write" ON public.news_classifications
  FOR ALL
  USING  (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS public.news_ingestion_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'pending',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  total_companies integer NOT NULL DEFAULT 0,
  total_articles integer NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT news_ingestion_runs_status_check CHECK (
    status IN ('pending', 'running', 'succeeded', 'failed', 'partial')
  )
);

CREATE INDEX IF NOT EXISTS news_ingestion_runs_started_at_idx
  ON public.news_ingestion_runs(started_at DESC);

ALTER TABLE public.news_ingestion_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "news_ingestion_runs_auth_read" ON public.news_ingestion_runs;
DROP POLICY IF EXISTS "news_ingestion_runs_auth_write" ON public.news_ingestion_runs;

CREATE POLICY "news_ingestion_runs_auth_read" ON public.news_ingestion_runs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "news_ingestion_runs_auth_write" ON public.news_ingestion_runs
  FOR ALL
  USING  (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
