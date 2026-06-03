-- Migration: create users and subscriptions tables for Supabase

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  phone text not null,
  city text not null,
  role text default 'user',
  created_at timestamptz default now()
);

-- enable RLS and policy to allow only owners to read/write their row
alter table public.users enable row level security;

create policy "users_self_access" on public.users
  for all using (auth.uid() = id) with check (auth.uid() = id);


create table if not exists public.subscriptions (
  id uuid primary key,
  user_id uuid references public.users(id) on delete cascade,
  plan text,
  status text,
  razorpay_subscription_id text,
  razorpay_payment_id text,
  trial_started_at timestamptz,
  current_period_end timestamptz,
  created_at timestamptz default now()
);

alter table public.subscriptions enable row level security;

create policy "subscriptions_self_access" on public.subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Note: Supabase service role key bypasses RLS for server-side operations.
