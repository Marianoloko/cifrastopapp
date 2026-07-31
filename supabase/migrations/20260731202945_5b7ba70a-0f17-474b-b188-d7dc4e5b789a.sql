-- 1) Restrict client-writable columns on profiles (protect trial_started_at)
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (preferred_cifra_theme, phone) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 2) Harden has_role: signed-in users may only check their own roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon')
     AND (auth.uid() IS NULL OR _user_id IS DISTINCT FROM auth.uid()) THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;