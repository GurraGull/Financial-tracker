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

CREATE POLICY "company_research_notes_public_read" ON public.company_research_notes
  FOR SELECT USING (true);

CREATE POLICY "company_research_notes_auth_write" ON public.company_research_notes
  FOR ALL
  USING  (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
