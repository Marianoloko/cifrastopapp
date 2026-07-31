UPDATE public.subscriptions SET status = 'active', current_period_end = '2999-12-31T00:00:00Z', updated_at = now() WHERE user_id = 'ad677f43-eaed-4d16-802f-bfa4e9db501a';

INSERT INTO public.subscriptions (user_id, status, current_period_end)
SELECT 'ad677f43-eaed-4d16-802f-bfa4e9db501a', 'active', '2999-12-31T00:00:00Z'
WHERE NOT EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = 'ad677f43-eaed-4d16-802f-bfa4e9db501a');