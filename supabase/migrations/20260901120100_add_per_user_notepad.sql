-- Per-user notepad (was the global, read-only app_config 'upcoming'). Editable.
create table if not exists public.notepad (
  user_id    uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  data       jsonb not null default '{"fund_managers":[],"big_buys":{"items":[],"total":0},"lending":{"items":[],"total":0},"studio":{"items":[],"total":0}}'::jsonb,
  updated_at timestamptz default now()
);

alter table public.notepad enable row level security;

drop policy if exists "own rows" on public.notepad;
create policy "own rows" on public.notepad
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- One-time seed: copy the owner's existing global notepad content into their row.
insert into public.notepad (user_id, data)
select '45763efa-7d31-4785-8031-9d5dd7023db5', value
from public.app_config
where key = 'upcoming'
on conflict (user_id) do nothing;
