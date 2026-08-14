
create or replace function public.get_affiliate_network()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  my_code text;
  plan_price numeric := 15;
  rates numeric[] := array[0.25, 0.10, 0.05, 0.025];
  result jsonb;
  levels jsonb;
  people jsonb;
  total_earn numeric := 0;
  withdrawn numeric := 0;
begin
  if me is null then
    return jsonb_build_object('ok', false, 'message', 'not authenticated');
  end if;

  select referral_code into my_code from public.profiles where id = me;

  with recursive net as (
    select p.id, p.referred_by, 1 as lvl
    from public.profiles p
    where p.referred_by = me
    union all
    select c.id, c.referred_by, n.lvl + 1
    from public.profiles c
    join net n on c.referred_by = n.id
    where n.lvl < 4
  ),
  enriched as (
    select
      n.id,
      n.lvl,
      coalesce(s.paid_confirmed, false) as paid,
      greatest(coalesce(s.paid_months, 0), case when coalesce(s.paid_confirmed, false) then 1 else 0 end) as months,
      pr.full_name,
      pr.email,
      pr.created_at
    from net n
    left join public.subscriptions s on s.user_id = n.id
    left join public.profiles pr on pr.id = n.id
  )
  select
    coalesce(jsonb_agg(jsonb_build_object(
      'level', lv.lvl,
      'rate', rates[lv.lvl],
      'per_member', round(plan_price * rates[lv.lvl], 2),
      'total', coalesce(agg.total, 0),
      'paid', coalesce(agg.paid, 0),
      'earnings', coalesce(agg.earnings, 0)
    ) order by lv.lvl), '[]'::jsonb),
    coalesce(sum(coalesce(agg.earnings, 0)), 0)
  into levels, total_earn
  from (select generate_series(1, 4) as lvl) lv
  left join (
    select
      lvl,
      count(*) as total,
      count(*) filter (where paid) as paid,
      round(sum(case when paid then plan_price * rates[lvl] * months else 0 end), 2) as earnings
    from enriched
    group by lvl
  ) agg on agg.lvl = lv.lvl;

  with recursive net as (
    select p.id, p.referred_by, 1 as lvl
    from public.profiles p
    where p.referred_by = me
    union all
    select c.id, c.referred_by, n.lvl + 1
    from public.profiles c
    join net n on c.referred_by = n.id
    where n.lvl < 4
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', n.id,
    'level', n.lvl,
    'name', coalesce(nullif(pr.full_name, ''), split_part(coalesce(pr.email, 'musico'), '@', 1)),
    'paid', coalesce(s.paid_confirmed, false),
    'joined_at', pr.created_at
  ) order by n.lvl, pr.created_at desc), '[]'::jsonb)
  into people
  from net n
  left join public.profiles pr on pr.id = n.id
  left join public.subscriptions s on s.user_id = n.id;

  select coalesce(sum(amount), 0) into withdrawn
  from public.withdrawal_requests
  where user_id = me and status in ('pending', 'paid');

  result := jsonb_build_object(
    'ok', true,
    'referral_code', coalesce(my_code, ''),
    'plan_price', plan_price,
    'levels', levels,
    'referrals', people,
    'total_earnings', round(total_earn, 2),
    'balance', greatest(round(total_earn - withdrawn, 2), 0),
    'withdrawn', round(withdrawn, 2)
  );

  return result;
end;
$$;

revoke all on function public.get_affiliate_network() from public;
grant execute on function public.get_affiliate_network() to authenticated;
