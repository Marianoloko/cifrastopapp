ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS paid_confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS first_paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS paid_months integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.get_referral_stats()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _me uuid := auth.uid();
  _code text;
  _claimed integer;
  _total integer;
  _paid integer;
  _first_month numeric;
  _recurring numeric;
BEGIN
  IF _me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Não autenticado');
  END IF;

  SELECT referral_code, referrals_claimed INTO _code, _claimed
  FROM public.profiles WHERE id = _me;

  SELECT count(*) INTO _total FROM public.profiles WHERE referred_by = _me;

  SELECT
    count(*),
    COALESCE(sum(15.00), 0),
    COALESCE(sum(greatest(s.paid_months - 1, 0) * 15.00 * 0.30), 0)
  INTO _paid, _first_month, _recurring
  FROM public.profiles p
  JOIN public.subscriptions s ON s.user_id = p.id
  WHERE p.referred_by = _me
    AND s.paid_confirmed = true
    AND s.paid_months >= 1;

  RETURN jsonb_build_object(
    'ok', true,
    'user_id', _me,
    'referral_code', _code,
    'total_referrals', COALESCE(_total, 0),
    'paid_referrals', COALESCE(_paid, 0),
    'first_month_earnings', COALESCE(_first_month, 0),
    'recurring_earnings', COALESCE(_recurring, 0),
    'balance', COALESCE(_first_month, 0) + COALESCE(_recurring, 0),
    'claimed_rewards', COALESCE(_claimed, 0),
    'available_referrals', COALESCE(_total, 0) - (COALESCE(_claimed, 0) * 3)
  );
END;
$function$;