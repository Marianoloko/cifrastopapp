ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_notes text;

CREATE TABLE IF NOT EXISTS public.search_misses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  query text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.search_misses TO authenticated;
GRANT ALL ON public.search_misses TO service_role;

ALTER TABLE public.search_misses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "search_misses_insert" ON public.search_misses
  FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "search_misses_admin_select" ON public.search_misses
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));