-- =========================================================
-- MBOA LIVE — Migration v3 : favoris
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- (après schema.sql et schema_v2_migration.sql ; ne supprime rien)
-- =========================================================

create table if not exists favorites (
  user_id uuid not null references profiles(id) on delete cascade,
  report_id uuid not null references reports(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, report_id)
);

alter table favorites enable row level security;

create policy "Un utilisateur voit ses propres favoris" on favorites
  for select using (auth.uid() = user_id);
create policy "Un utilisateur gère ses propres favoris" on favorites
  for insert with check (auth.uid() = user_id);
create policy "Un utilisateur retire ses propres favoris" on favorites
  for delete using (auth.uid() = user_id);
