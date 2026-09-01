-- Multi-tenant isolation: each user gets a private dashboard.
-- Backfills all existing rows to the owner (45763efa-…) before enforcing not-null.

-- 1. Add user_id to per-user tables
alter table public.income_entries  add column user_id uuid references auth.users(id) on delete cascade;
alter table public.expense_entries add column user_id uuid references auth.users(id) on delete cascade;
alter table public.transfers       add column user_id uuid references auth.users(id) on delete cascade;
alter table public.pots            add column user_id uuid references auth.users(id) on delete cascade;
alter table public.pot_snapshots   add column user_id uuid references auth.users(id) on delete cascade;

-- 2. Backfill existing rows to the owner
update public.income_entries  set user_id = '45763efa-7d31-4785-8031-9d5dd7023db5' where user_id is null;
update public.expense_entries set user_id = '45763efa-7d31-4785-8031-9d5dd7023db5' where user_id is null;
update public.transfers       set user_id = '45763efa-7d31-4785-8031-9d5dd7023db5' where user_id is null;
update public.pots            set user_id = '45763efa-7d31-4785-8031-9d5dd7023db5' where user_id is null;
update public.pot_snapshots   set user_id = '45763efa-7d31-4785-8031-9d5dd7023db5' where user_id is null;

-- 3. Default to the caller + enforce not-null
alter table public.income_entries  alter column user_id set default auth.uid(), alter column user_id set not null;
alter table public.expense_entries alter column user_id set default auth.uid(), alter column user_id set not null;
alter table public.transfers       alter column user_id set default auth.uid(), alter column user_id set not null;
alter table public.pots            alter column user_id set default auth.uid(), alter column user_id set not null;
alter table public.pot_snapshots   alter column user_id set default auth.uid(), alter column user_id set not null;

-- 4. Per-user indexes (RLS performance)
create index if not exists idx_income_user   on public.income_entries(user_id);
create index if not exists idx_expense_user  on public.expense_entries(user_id);
create index if not exists idx_transfer_user on public.transfers(user_id);
create index if not exists idx_pot_user      on public.pots(user_id);
create index if not exists idx_snap_user     on public.pot_snapshots(user_id);

-- 5. pots.key: global unique -> per-user unique
alter table public.pots drop constraint if exists pots_key_key;
alter table public.pots add constraint pots_user_key_uq unique (user_id, key);

-- 6. RLS: replace "owner rw" with per-user policies
drop policy "owner rw" on public.income_entries;
drop policy "owner rw" on public.expense_entries;
drop policy "owner rw" on public.transfers;
drop policy "owner rw" on public.pots;
drop policy "owner rw" on public.pot_snapshots;

create policy "own rows" on public.income_entries  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own rows" on public.expense_entries for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own rows" on public.transfers       for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own rows" on public.pots            for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own rows" on public.pot_snapshots   for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- quota_config + app_config stay global: readable by any signed-in user, no writes
drop policy "owner rw" on public.quota_config;
drop policy "owner rw" on public.app_config;
create policy "read all" on public.quota_config for select using ((select auth.uid()) is not null);
create policy "read all" on public.app_config  for select using ((select auth.uid()) is not null);

-- 7. RPCs: stamp user_id, touch only the caller's bank
create or replace function public.add_income(p_amount numeric, p_source text, p_category text default null, p_note text default null, p_date date default current_date)
returns void language plpgsql set search_path to '' as $$
begin
  insert into public.income_entries (user_id, entry_date, ym, source_name, category, amount, note)
  values (auth.uid(), p_date, to_char(p_date, 'YYYY-MM'), p_source, p_category, p_amount, p_note);
  update public.pots set current_balance = current_balance + p_amount where is_bank and user_id = auth.uid();
end; $$;

create or replace function public.add_expense(p_amount numeric, p_bucket text, p_category text default null, p_note text default null, p_date date default current_date)
returns void language plpgsql set search_path to '' as $$
begin
  insert into public.expense_entries (user_id, entry_date, ym, bucket_key, category, amount, note)
  values (auth.uid(), p_date, to_char(p_date, 'YYYY-MM'), p_bucket, p_category, p_amount, p_note);
  update public.pots set current_balance = current_balance - p_amount where is_bank and user_id = auth.uid();
end; $$;

create or replace function public.add_transfer(p_amount numeric, p_pot_id uuid, p_quota text, p_date date default current_date)
returns void language plpgsql set search_path to '' as $$
begin
  insert into public.transfers (user_id, entry_date, ym, pot_id, quota_key, amount)
  values (auth.uid(), p_date, to_char(p_date, 'YYYY-MM'), p_pot_id, p_quota, p_amount);
  update public.pots set current_balance = current_balance + p_amount where id = p_pot_id and user_id = auth.uid();
  update public.pots set current_balance = current_balance - p_amount where is_bank and user_id = auth.uid();
end; $$;

-- 8. Seed a starter pot set for a new user (idempotent, per-caller)
create or replace function public.ensure_default_pots()
returns void language plpgsql set search_path to '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then return; end if;
  if exists (select 1 from public.pots where user_id = uid) then return; end if;
  insert into public.pots (user_id, key, name, bucket_key, color, is_bank, current_balance) values
    (uid, 'bank',         'Bank',         null,        '#D8AC55', true,  0),
    (uid, 'savings',      'Savings',      'bills',     '#82AE98', false, 0),
    (uid, 'vacation',     'Vacation',     'emergency', '#D2A85F', false, 0),
    (uid, 'stocks',       'Stocks',       'invest',    '#9096CE', false, 0),
    (uid, 'crypto',       'Crypto',       'invest',    '#9096CE', false, 0),
    (uid, 'mutual_funds', 'Mutual Funds', 'invest',    '#9096CE', false, 0);
end; $$;
