-- ============================================================
--  MiCarro — tablas carros y mantenimientos (datos PRIVADOS por usuario)
--  Ejecutar en Supabase → SQL Editor → Run
-- ============================================================

create table if not exists carros (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  marca      text not null,
  modelo     text not null,
  anio       int,
  placa      text,
  km_actual  numeric default 0,
  created_at timestamptz default now()
);
alter table carros enable row level security;
drop policy if exists "carros select" on carros;
create policy "carros select" on carros for select using (auth.uid() = user_id);
drop policy if exists "carros insert" on carros;
create policy "carros insert" on carros for insert with check (auth.uid() = user_id);
drop policy if exists "carros update" on carros;
create policy "carros update" on carros for update using (auth.uid() = user_id);
drop policy if exists "carros delete" on carros;
create policy "carros delete" on carros for delete using (auth.uid() = user_id);

create table if not exists mantenimientos (
  id         uuid primary key default gen_random_uuid(),
  carro_id   uuid references carros(id) on delete cascade not null,
  user_id    uuid references auth.users(id) on delete cascade not null,
  tipo       text not null,
  fecha      date not null,
  km         numeric,
  costo      numeric,
  nota       text,
  created_at timestamptz default now()
);
alter table mantenimientos enable row level security;
drop policy if exists "mant select" on mantenimientos;
create policy "mant select" on mantenimientos for select using (auth.uid() = user_id);
drop policy if exists "mant insert" on mantenimientos;
create policy "mant insert" on mantenimientos for insert with check (auth.uid() = user_id);
drop policy if exists "mant delete" on mantenimientos;
create policy "mant delete" on mantenimientos for delete using (auth.uid() = user_id);
