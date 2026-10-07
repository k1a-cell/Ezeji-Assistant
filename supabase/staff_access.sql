create table if not exists public.staff_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.profiles(id) on delete cascade,
  email text not null,
  invited_at timestamptz not null default now()
);

create unique index if not exists staff_members_business_email_unique
  on public.staff_members (business_id, lower(email));

alter table public.staff_members enable row level security;
revoke all on public.staff_members from anon, authenticated;

create or replace function public.has_active_premium_plan(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_business_id
      and p.plan in ('Professional', 'Business')
      and p.payment_status = 'active'
  );
$$;

revoke all on function public.has_active_premium_plan(uuid) from public;
grant execute on function public.has_active_premium_plan(uuid) to authenticated;

create or replace function public.is_business_staff(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.staff_members sm
    where sm.business_id = p_business_id
      and lower(sm.email) = lower(auth.jwt() ->> 'email')
      and public.has_active_premium_plan(sm.business_id)
  );
$$;

revoke all on function public.is_business_staff(uuid) from public;
grant execute on function public.is_business_staff(uuid) to authenticated;

alter table public.bookings enable row level security;
drop policy if exists "Paid plans only for booking management" on public.bookings;
create policy "Paid plans only for booking management"
  on public.bookings as restrictive for all to authenticated
  using (public.has_active_premium_plan(business_id) or public.is_business_staff(business_id))
  with check (public.has_active_premium_plan(business_id) or public.is_business_staff(business_id));
drop policy if exists "Business owners can read bookings" on public.bookings;
create policy "Business owners can read bookings"
  on public.bookings for select to authenticated
  using (auth.uid() = business_id and public.has_active_premium_plan(business_id));
drop policy if exists "Business owners can update bookings" on public.bookings;
create policy "Business owners can update bookings"
  on public.bookings for update to authenticated
  using (auth.uid() = business_id and public.has_active_premium_plan(business_id))
  with check (auth.uid() = business_id and public.has_active_premium_plan(business_id));
drop policy if exists "Business owners can delete bookings" on public.bookings;
create policy "Business owners can delete bookings"
  on public.bookings for delete to authenticated
  using (auth.uid() = business_id and public.has_active_premium_plan(business_id));
drop policy if exists "Staff can read business bookings" on public.bookings;
create policy "Staff can read business bookings"
  on public.bookings for select to authenticated
  using (public.is_business_staff(business_id));
drop policy if exists "Staff can update business bookings" on public.bookings;
create policy "Staff can update business bookings"
  on public.bookings for update to authenticated
  using (public.is_business_staff(business_id))
  with check (public.is_business_staff(business_id));
drop policy if exists "Staff can delete business bookings" on public.bookings;
create policy "Staff can delete business bookings"
  on public.bookings for delete to authenticated
  using (public.is_business_staff(business_id));

alter table public.conversations enable row level security;
drop policy if exists "Business owners can read conversations" on public.conversations;
create policy "Business owners can read conversations"
  on public.conversations for select to authenticated
  using (auth.uid() = business_id);
drop policy if exists "Staff can read business conversations" on public.conversations;
create policy "Staff can read business conversations"
  on public.conversations for select to authenticated
  using (public.is_business_staff(business_id));

drop policy if exists "Customers can log conversations" on public.conversations;
create policy "Customers can log conversations"
  on public.conversations for insert to anon, authenticated
  with check (true);

create or replace function public.protect_paid_plan_fields()
returns trigger
language plpgsql
set search_path = public, auth
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.plan := '14-day trial';
    new.payment_status := 'trial';
    new.trial_active := true;
    new.trial_ends_at := now() + interval '14 days';
    new.billing_period := 'monthly';
  else
    new.plan := old.plan;
    new.payment_status := old.payment_status;
    new.trial_active := old.trial_active;
    new.trial_ends_at := old.trial_ends_at;
    new.billing_period := old.billing_period;
  end if;

  return new;
end;
$$;

revoke all on function public.protect_paid_plan_fields() from public;

drop trigger if exists protect_paid_plan_fields on public.profiles;
create trigger protect_paid_plan_fields
  before insert or update on public.profiles
  for each row execute function public.protect_paid_plan_fields();