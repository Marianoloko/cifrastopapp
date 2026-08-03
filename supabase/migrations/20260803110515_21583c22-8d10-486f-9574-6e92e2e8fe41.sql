ALTER TABLE public.songs ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE public.songs ADD COLUMN IF NOT EXISTS bpm INTEGER;

CREATE TABLE IF NOT EXISTS public.traffic_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  path TEXT NOT NULL,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT INSERT ON public.traffic_events TO authenticated;
GRANT INSERT ON public.traffic_events TO anon;
GRANT ALL ON public.traffic_events TO service_role;
ALTER TABLE public.traffic_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone can log traffic" ON public.traffic_events;
CREATE POLICY "anyone can log traffic" ON public.traffic_events FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "admins read traffic" ON public.traffic_events;
CREATE POLICY "admins read traffic" ON public.traffic_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));