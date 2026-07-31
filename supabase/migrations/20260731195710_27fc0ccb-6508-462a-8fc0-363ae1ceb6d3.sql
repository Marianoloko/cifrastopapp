REVOKE ALL ON FUNCTION public.get_referral_stats() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.apply_referral_code(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.claim_referral_reward() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.generate_referral_code() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_referral_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_referral_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_referral_reward() TO authenticated;