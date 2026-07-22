-- =========================================================
-- MBOA LIVE — Migration v2 : feed vertical façon réseau social
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- (à lancer APRÈS le schema.sql initial ; ne supprime aucune donnée)
-- =========================================================

-- ---------- 1. Nouvelles catégories (Voirie / Éclairage / Eau / Environnement / Autre) ----------
-- Si tu as déjà des signalements en base avec les anciennes catégories,
-- on les fait pointer vers les nouvelles équivalentes AVANT de supprimer
-- les anciennes lignes (sinon la contrainte de clé étrangère bloque).
insert into categories (id, label, icon, color) values
  ('voirie',        'Voirie',        '🛣️', '#E8B33D'),
  ('eclairage',     'Éclairage',     '💡', '#3B82F6'),
  ('eau',           'Eau',           '🚰', '#2E9E6D'),
  ('environnement', 'Environnement', '🌳', '#8B5CF6'),
  ('autre',         'Autre',         '📍', '#9CA6A0')
on conflict (id) do update set label = excluded.label, icon = excluded.icon, color = excluded.color;

update reports set category_id = 'voirie'        where category_id in ('traffic', 'accident', 'road', 'incident');
update reports set category_id = 'eclairage'     where category_id in ('power');
update reports set category_id = 'eau'           where category_id in ('water', 'flood');
update reports set category_id = 'environnement' where category_id in ('event', 'concert');
update reports set category_id = 'autre'         where category_id in ('restaurant', 'business', 'promo', 'other');

delete from categories
  where id in ('traffic','accident','road','event','concert','restaurant','business','promo','flood','power','water','incident','other');

-- ---------- 2. Statut "en cours de traitement" ----------
alter table reports drop constraint if exists reports_status_check;
alter table reports add constraint reports_status_check
  check (status in ('active', 'in_progress', 'resolved', 'removed'));

-- ---------- 3. Compteurs commentaires / partages sur reports ----------
alter table reports add column if not exists comments_count int not null default 0;
alter table reports add column if not exists shares_count int not null default 0;

-- Trigger : incrémente comments_count à chaque nouveau commentaire
-- (même logique que le trigger de confirmations déjà en place)
create or replace function increment_report_comments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update reports set comments_count = comments_count + 1 where id = new.report_id;
  return new;
end;
$$;

drop trigger if exists on_comment_insert on comments;
create trigger on_comment_insert
  after insert on comments
  for each row execute function increment_report_comments();

-- ---------- 4. Partages (pour alimenter shares_count) ----------
create table if not exists report_shares (
  id uuid primary key default uuid_generate_v4(),
  report_id uuid not null references reports(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table report_shares enable row level security;
drop policy if exists "Un utilisateur connecté peut enregistrer un partage" on report_shares;
create policy "Un utilisateur connecté peut enregistrer un partage" on report_shares
  for insert with check (auth.uid() = user_id);
drop policy if exists "Partages visibles par tous" on report_shares;
create policy "Partages visibles par tous" on report_shares for select using (true);

create or replace function increment_report_shares()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update reports set shares_count = shares_count + 1 where id = new.report_id;
  return new;
end;
$$;

drop trigger if exists on_share_insert on report_shares;
create trigger on_share_insert
  after insert on report_shares
  for each row execute function increment_report_shares();

-- ---------- 5. Abonnements (onglet "Abonnements" du feed) ----------
create table if not exists follows (
  follower_id uuid not null references profiles(id) on delete cascade,
  following_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

alter table follows enable row level security;
drop policy if exists "Abonnements visibles par tous" on follows;
create policy "Abonnements visibles par tous" on follows for select using (true);
drop policy if exists "Un utilisateur gère ses propres abonnements" on follows;
create policy "Un utilisateur gère ses propres abonnements" on follows
  for all using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

-- ---------- 6. Type de notification (pour la bonne icône dans l'app) ----------
alter table notifications add column if not exists type text not null default 'system'
  check (type in ('comment', 'status', 'like', 'system'));

-- Policy manquante dans le schema initial : sans elle, "marquer comme lu"
-- échoue silencieusement (même type de blocage RLS que pour les confirmations).
drop policy if exists "Un utilisateur marque ses notifications comme lues" on notifications;
create policy "Un utilisateur marque ses notifications comme lues" on notifications
  for update using (auth.uid() = user_id);

-- ---------- 7. Nom d'utilisateur public (@handle affiché sur le feed) ----------
alter table profiles add column if not exists username text unique;
