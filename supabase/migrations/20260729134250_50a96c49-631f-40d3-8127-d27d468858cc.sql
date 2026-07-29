create type public.app_role as enum ('admin', 'user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  phone text,
  preferred_cifra_theme text not null default 'cifraclub',
  trial_started_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.songs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  artist text not null default '',
  key text not null default 'C',
  capo text not null default 'Sem Capo',
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'inactive',
  current_period_end timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  updated_at timestamptz not null default now()
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price_label text not null default '',
  period_label text not null default '',
  duration_days integer not null default 30,
  badge text,
  featured boolean not null default false,
  whatsapp_message text not null default '',
  features jsonb not null default '[]'::jsonb,
  rules jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  unique (user_id, role)
);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, phone, trial_started_at)
  values (new.id, new.email, new.raw_user_meta_data->>'phone', now())
  on conflict (id) do nothing;

  insert into public.subscriptions (user_id, status) values (new.id, 'inactive')
  on conflict (user_id) do nothing;

  return new;
end; $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.songs enable row level security;
alter table public.subscriptions enable row level security;
alter table public.plans enable row level security;
alter table public.user_roles enable row level security;

create policy own_profile_select on public.profiles for select to authenticated using (auth.uid() = id);
create policy own_profile_update on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy admin_profiles_select on public.profiles for select to authenticated using (public.has_role(auth.uid(),'admin'));

create policy own_songs_all on public.songs for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy own_subscription_select on public.subscriptions for select to authenticated using (auth.uid() = user_id);
create policy admin_subscriptions_all on public.subscriptions for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy plans_public_read on public.plans for select to anon, authenticated using (active = true);
create policy plans_admin_all on public.plans for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy own_roles_select on public.user_roles for select to authenticated using (auth.uid() = user_id);

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.songs to authenticated;
grant select, insert, update, delete on public.subscriptions to authenticated;
grant select, insert, update, delete on public.plans to authenticated;
grant select on public.user_roles to authenticated;
grant select on public.plans to anon;
grant all on public.profiles, public.songs, public.subscriptions, public.plans, public.user_roles to service_role;

insert into public.plans (name, description, price_label, period_label, duration_days, badge, featured, whatsapp_message, features, sort_order) values
('Mensal', 'Acesso completo ao kit do músico por 30 dias.', 'R$ 15,00', 'por mês', 30, null, false, 'Olá! Quero assinar o plano Mensal do CifraStop (R$ 15,00 por mês).', '["Cifras ilimitadas","Sincronização na nuvem","Afinador, metrônomo e gravador","Retorno de áudio ao vivo"]'::jsonb, 1),
('Trimestral', 'Três meses de acesso com economia.', 'R$ 39,00', 'a cada 3 meses', 90, 'Popular', true, 'Olá! Quero assinar o plano Trimestral do CifraStop (R$ 39,00 a cada 3 meses).', '["Tudo do plano Mensal","Economia de 13%","Suporte prioritário no WhatsApp"]'::jsonb, 2),
('Anual', 'Um ano inteiro de CifraStop.', 'R$ 129,00', 'por ano', 365, 'Melhor Valor', false, 'Olá! Quero assinar o plano Anual do CifraStop (R$ 129,00 por ano).', '["Tudo do plano Trimestral","Economia de 28%","Acesso a novidades em primeira mão"]'::jsonb, 3);