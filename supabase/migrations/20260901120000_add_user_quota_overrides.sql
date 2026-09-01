-- Per-user percentage overrides for the 4 global buckets.
-- quota_config stays the global taxonomy (keys are FK targets); this table only
-- overrides pct per user. A user with no rows here falls back to the global pct.
create table if not exists public.user_quota (
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  key     text not null references public.quota_config(key),
  pct     numeric not null,
  primary key (user_id, key)
);

alter table public.user_quota enable row level security;

drop policy if exists "own rows" on public.user_quota;
create policy "own rows" on public.user_quota
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Onboarding / edit-split: upsert the caller's 4 bucket percentages in one call.
create or replace function public.set_user_quota(
  p_bills numeric, p_invest numeric, p_emergency numeric, p_personal numeric
) returns void language plpgsql set search_path to '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then return; end if;
  insert into public.user_quota (user_id, key, pct) values
    (uid, 'bills',     p_bills),
    (uid, 'invest',    p_invest),
    (uid, 'emergency', p_emergency),
    (uid, 'personal',  p_personal)
  on conflict (user_id, key) do update set pct = excluded.pct;
end; $$;
