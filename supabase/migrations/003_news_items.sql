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

CREATE POLICY "news_items_public_read" ON public.news_items
  FOR SELECT USING (is_published = true);

CREATE POLICY "news_items_auth_write" ON public.news_items
  FOR ALL
  USING  (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
