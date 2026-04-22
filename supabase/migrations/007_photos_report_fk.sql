-- Link photos to their parent condition report
-- Previously photos were only linked to a trail, making it impossible to
-- display photos alongside the specific report they were submitted with.

ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS condition_report_id text
  REFERENCES public.condition_reports(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_photos_report_id ON public.photos(condition_report_id);
