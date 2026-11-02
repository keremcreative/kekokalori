-- Günlük kilo kaydı. İlk kurulumdan sonra eklendi: SQL Editor'da bir kez çalıştır.

create table if not exists public.weight_logs (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  logged_on date not null,
  weight_kg numeric not null check (weight_kg between 20 and 400),
  created_at timestamptz not null default now(),
  primary key (user_id, logged_on)
);

alter table public.weight_logs enable row level security;

drop policy if exists "own weights" on public.weight_logs;
create policy "own weights" on public.weight_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on public.weight_logs to authenticated;
