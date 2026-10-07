create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  customer_email text not null,
  customer_name text not null,
  business_name text not null,
  plan text not null,
  billing_period text not null check (billing_period in ('monthly', 'yearly')),
  amount bigint not null,
  currency text not null default 'NGN',
  transfer_reference text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.payment_requests enable row level security;

drop policy if exists "Anyone can submit payment requests" on public.payment_requests;
create policy "Anyone can submit payment requests"
  on public.payment_requests for insert
  with check (true);

drop policy if exists "Customers can read their payment requests" on public.payment_requests;
create policy "Customers can read their payment requests"
  on public.payment_requests for select
  using (lower(customer_email) = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "Customers can update their payment requests" on public.payment_requests;
create policy "Customers can update their payment requests"
  on public.payment_requests for update
  using (lower(customer_email) = lower(coalesce(auth.jwt() ->> 'email', '')));
