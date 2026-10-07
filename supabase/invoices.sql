create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null check (provider in ('stripe', 'paystack', 'trial')),
  provider_reference text not null,
  amount bigint not null default 0,
  currency text not null default 'USD',
  plan text not null,
  billing_period text not null check (billing_period in ('monthly', 'yearly')),
  status text not null default 'paid' check (status in ('trial', 'paid', 'failed', 'refunded')),
  customer_email text,
  created_at timestamptz not null default now(),
  unique (provider, provider_reference)
);

alter table public.invoices enable row level security;

drop policy if exists "Businesses can read their invoices" on public.invoices;
create policy "Businesses can read their invoices"
  on public.invoices for select
  using (auth.uid() = business_id);
