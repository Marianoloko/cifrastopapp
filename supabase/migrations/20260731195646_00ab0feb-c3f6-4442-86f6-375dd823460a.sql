CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE c text;
BEGIN
  LOOP
    c := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = c);
  END LOOP;
  RETURN c;
END;
$$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referrals_claimed integer NOT NULL DEFAULT 0;

UPDATE public.profiles SET referral_code = public.generate_referral_code() WHERE referral_code IS NULL;

ALTER TABLE public.profiles ALTER COLUMN referral_code SET DEFAULT public.generate_referral_code();
ALTER TABLE public.profiles ALTER COLUMN referral_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_key ON public.profiles (referral_code);
CREATE INDEX IF NOT EXISTS profiles_referred_by_idx ON public.profiles (referred_by);

CREATE OR REPLACE FUNCTION public.get_referral_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me uuid := auth.uid();
  _code text;
  _claimed integer;
  _total integer;
BEGIN
  IF _me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Não autenticado');
  END IF;

  SELECT referral_code, referrals_claimed INTO _code, _claimed
  FROM public.profiles WHERE id = _me;

  SELECT count(*) INTO _total FROM public.profiles WHERE referred_by = _me;

  RETURN jsonb_build_object(
    'ok', true,
    'user_id', _me,
    'referral_code', _code,
    'total_referrals', COALESCE(_total, 0),
    'claimed_rewards', COALESCE(_claimed, 0),
    'available_referrals', COALESCE(_total, 0) - (COALESCE(_claimed, 0) * 3)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_referral_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me uuid := auth.uid();
  _ref uuid;
BEGIN
  IF _me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Não autenticado');
  END IF;

  IF _code IS NULL OR length(trim(_code)) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Informe um código de indicação.');
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = _me AND referred_by IS NOT NULL) THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Você já usou um código de indicação.');
  END IF;

  SELECT id INTO _ref FROM public.profiles
  WHERE upper(referral_code) = upper(trim(_code)) AND id <> _me;

  IF _ref IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Código de indicação inválido.');
  END IF;

  UPDATE public.profiles SET referred_by = _ref WHERE id = _me;

  INSERT INTO public.subscriptions (user_id, status, current_period_end)
  VALUES (_me, 'active', now() + interval '24 hours')
  ON CONFLICT (user_id) DO UPDATE
    SET status = 'active',
        current_period_end = greatest(COALESCE(public.subscriptions.current_period_end, now()), now()) + interval '24 hours';

  RETURN jsonb_build_object('ok', true, 'message', 'Código aplicado! Você ganhou 24 horas de acesso VIP.');
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_referral_reward()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me uuid := auth.uid();
  _claimed integer;
  _total integer;
  _end timestamptz;
BEGIN
  IF _me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Não autenticado');
  END IF;

  SELECT referrals_claimed INTO _claimed FROM public.profiles WHERE id = _me FOR UPDATE;
  SELECT count(*) INTO _total FROM public.profiles WHERE referred_by = _me;

  IF COALESCE(_total, 0) - (COALESCE(_claimed, 0) * 3) < 3 THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Você ainda não tem 3 amigos indicados.');
  END IF;

  UPDATE public.profiles SET referrals_claimed = referrals_claimed + 1 WHERE id = _me;

  INSERT INTO public.subscriptions (user_id, status, current_period_end)
  VALUES (_me, 'active', now() + interval '30 days')
  ON CONFLICT (user_id) DO UPDATE
    SET status = 'active',
        current_period_end = greatest(COALESCE(public.subscriptions.current_period_end, now()), now()) + interval '30 days'
  RETURNING current_period_end INTO _end;

  RETURN jsonb_build_object('ok', true, 'message', 'Prêmio resgatado! 1 mês VIP adicionado.', 'current_period_end', _end);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_referral_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_referral_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_referral_reward() TO authenticated;