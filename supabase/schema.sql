-- Kalori uygulaması veritabanı şeması
-- Supabase panelinde: SQL Editor > New query > bu dosyanın tamamını yapıştır > Run
-- Sonra aynı klasördeki 02_weight.sql dosyasını da aynı şekilde çalıştır.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  sex text not null check (sex in ('male', 'female')),
  birth_year int not null check (birth_year between 1900 and 2100),
  height_cm numeric not null check (height_cm between 80 and 260),
  weight_kg numeric not null check (weight_kg between 20 and 400),
  activity text not null check (activity in ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  goal text not null check (goal in ('lose', 'maintain', 'gain')),
  updated_at timestamptz not null default now()
);

create table if not exists public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  eaten_on date not null,
  meal text not null check (meal in ('breakfast', 'lunch', 'dinner', 'snack', 'water')),
  name text not null,
  grams numeric not null check (grams > 0 and grams < 10000),
  -- 100 g başına besin değerleri: {"kcal": 155, "protein": 12.6, ...}
  per100 jsonb not null default '{}'::jsonb,
  source text not null default 'db' check (source in ('db', 'photo', 'custom', 'water')),
  created_at timestamptz not null default now()
);

create index if not exists food_logs_user_date on public.food_logs (user_id, eaten_on);

-- Herkes sadece kendi verisini görebilir ve değiştirebilir
alter table public.profiles enable row level security;
alter table public.food_logs enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own logs" on public.food_logs;
create policy "own logs" on public.food_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Uygulamanın tablolara erişimi (Supabase'de "Automatically expose new tables" kapalıysa da çalışsın diye)
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.food_logs to authenticated;
