-- Saved trails (user bookmarks)
CREATE TABLE IF NOT EXISTS public.saved_trails (
  id          text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id     text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  trail_id    text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, trail_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_trails_user_id ON public.saved_trails(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_trails_trail_id ON public.saved_trails(trail_id);

ALTER TABLE public.saved_trails ENABLE ROW LEVEL SECURITY;

CREATE POLICY saved_trails_owner ON public.saved_trails
  FOR ALL
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);
