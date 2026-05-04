CREATE TABLE IF NOT EXISTS public.bug_reports (
  id          text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  category    text NOT NULL CHECK (category IN ('map', 'data', 'ui', 'performance', 'other')),
  description text NOT NULL CHECK (char_length(description) <= 1000),
  page_url    text,
  user_id     text REFERENCES public.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bug_reports_created_at ON public.bug_reports(created_at DESC);

ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can insert
CREATE POLICY bug_reports_insert ON public.bug_reports
  FOR INSERT
  WITH CHECK (true);

-- Only service role can read (enforced by admin page using service client)
CREATE POLICY bug_reports_select ON public.bug_reports
  FOR SELECT
  USING (false);
