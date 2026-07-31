ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS banned_at timestamptz;

GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;