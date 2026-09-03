-- Web-push subscriptions: one row per browser endpoint, owned by a user. The
-- monthly reminder cron reads every row via the service role (bypasses RLS);
-- through the API a user can only see and manage their own.
create table if not exists public.push_subscriptions (
  endpoint    text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade default auth.uid(),
  p256dh      text not null,
  auth        text not null,
  first_name  text,
  created_at  timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "own subs" on public.push_subscriptions;
create policy "own subs" on public.push_subscriptions
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index if not exists idx_push_user on public.push_subscriptions(user_id);
