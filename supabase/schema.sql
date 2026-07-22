-- =========================================================
-- MBOA LIVE — Schéma de base de données Supabase
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- =========================================================

-- ---------- Extensions ----------
create extension if not exists "uuid-ossp";

-- ---------- Villes ----------
create table if not exists cities (
  id text primary key,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  active boolean default true
);

insert into cities (id, name, lat, lng) values
  ('douala', 'Douala', 4.0511, 9.7679),
  ('yaounde', 'Yaoundé', 3.8480, 11.5021)
on conflict (id) do nothing;

-- ---------- Catégories ----------
create table if not exists categories (
  id text primary key,
  label text not null,
  icon text not null,
  color text not null
);

insert into categories (id, label, icon, color) values
  ('voirie',        'Voirie',        '🛣️', '#E8B33D'),
  ('eclairage',     'Éclairage',     '💡', '#3B82F6'),
  ('eau',           'Eau',           '🚰', '#2E9E6D'),
  ('environnement', 'Environnement', '🌳', '#8B5CF6'),
  ('autre',         'Autre',         '📍', '#9CA6A0')
on conflict (id) do nothing;

-- ---------- Profils utilisateurs (lié à auth.users) ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  username text unique,
  avatar_url text,
  city text references cities(id),
  trust_score int not null default 10,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- Signalements ----------
create table if not exists reports (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete set null,
  category_id text not null references categories(id),
  title text not null,
  description text,
  city_id text not null references cities(id),
  lat double precision not null,
  lng double precision not null,
  media_urls text[] default '{}',
  media_type text check (media_type in ('photo', 'video')),
  status text not null default 'active' check (status in ('active', 'in_progress', 'resolved', 'removed')),
  confirmations_up int not null default 0,
  confirmations_down int not null default 0,
  comments_count int not null default 0,
  shares_count int not null default 0,
  views_count int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists reports_city_idx on reports (city_id);
create index if not exists reports_category_idx on reports (category_id);
create index if not exists reports_created_idx on reports (created_at desc);

-- ---------- Confirmations ("toujours d'actualité ?") ----------
create table if not exists confirmations (
  id uuid primary key default uuid_generate_v4(),
  report_id uuid not null references reports(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  is_still_happening boolean not null,
  created_at timestamptz not null default now(),
  unique (report_id, user_id)
);

-- ---------- Commentaires ----------
create table if not exists comments (
  id uuid primary key default uuid_generate_v4(),
  report_id uuid not null references reports(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  parent_id uuid references comments(id) on delete cascade,
  content text not null,
  edited boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- Notifications ----------
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null default 'system' check (type in ('comment', 'status', 'like', 'system')),
  title text not null,
  body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- Partages ----------
create table if not exists report_shares (
  id uuid primary key default uuid_generate_v4(),
  report_id uuid not null references reports(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- Abonnements ----------
create table if not exists follows (
  follower_id uuid not null references profiles(id) on delete cascade,
  following_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

-- ---------- Favoris ----------
create table if not exists favorites (
  user_id uuid not null references profiles(id) on delete cascade,
  report_id uuid not null references reports(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, report_id)
);

-- ---------- Vues ----------
create table if not exists report_views (
  report_id uuid not null references reports(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (report_id, user_id)
);

-- ---------- Signalement de contenu ----------
create table if not exists report_flags (
  id uuid primary key default uuid_generate_v4(),
  report_id uuid not null references reports(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  reason text not null check (reason in ('spam', 'harcelement', 'violence', 'inapproprie', 'autre')),
  details text,
  created_at timestamptz not null default now(),
  unique (report_id, user_id)
);

-- =========================================================
-- Row Level Security (RLS)
-- =========================================================
alter table profiles enable row level security;
alter table reports enable row level security;
alter table confirmations enable row level security;
alter table comments enable row level security;
alter table notifications enable row level security;
alter table report_shares enable row level security;
alter table follows enable row level security;
alter table favorites enable row level security;
alter table report_views enable row level security;
alter table report_flags enable row level security;

-- Profiles : chacun voit tous les profils publics, mais ne modifie que le sien
create policy "Profils visibles par tous" on profiles for select using (true);
create policy "Un utilisateur modifie son propre profil" on profiles for update using (auth.uid() = id);
create policy "Un utilisateur crée son propre profil" on profiles for insert with check (auth.uid() = id);

-- Reports : visibles par tous, création réservée aux utilisateurs connectés,
-- modification/suppression réservée à l'auteur (les admins sont gérés à part,
-- voir la note "Admin" plus bas)
create policy "Signalements visibles par tous" on reports for select using (status != 'removed');
create policy "Utilisateurs connectés peuvent signaler" on reports for insert with check (auth.uid() = user_id);
create policy "L'auteur peut modifier son signalement" on reports for update using (auth.uid() = user_id);

-- Confirmations
create policy "Confirmations visibles par tous" on confirmations for select using (true);
create policy "Un utilisateur connecté peut confirmer" on confirmations for insert with check (auth.uid() = user_id);
create policy "Un utilisateur modifie sa propre confirmation" on confirmations for update using (auth.uid() = user_id);

-- Comments
create policy "Commentaires visibles par tous" on comments for select using (true);
create policy "Utilisateurs connectés peuvent commenter" on comments for insert with check (auth.uid() = user_id);

-- Notifications : uniquement visibles par leur destinataire
create policy "Un utilisateur voit ses notifications" on notifications for select using (auth.uid() = user_id);
create policy "Un utilisateur marque ses notifications comme lues" on notifications for update using (auth.uid() = user_id);

-- Partages
create policy "Partages visibles par tous" on report_shares for select using (true);
create policy "Un utilisateur connecté peut enregistrer un partage" on report_shares for insert with check (auth.uid() = user_id);

-- Abonnements
create policy "Abonnements visibles par tous" on follows for select using (true);
create policy "Un utilisateur gère ses propres abonnements" on follows
  for all using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

-- Favoris
create policy "Un utilisateur voit ses propres favoris" on favorites
  for select using (auth.uid() = user_id);
create policy "Un utilisateur gère ses propres favoris" on favorites
  for insert with check (auth.uid() = user_id);
create policy "Un utilisateur retire ses propres favoris" on favorites
  for delete using (auth.uid() = user_id);

-- Édition / suppression de ses propres commentaires
create policy "Un utilisateur modifie son propre commentaire" on comments
  for update using (auth.uid() = user_id);
create policy "Un utilisateur supprime son propre commentaire" on comments
  for delete using (auth.uid() = user_id);

-- Vues
create policy "Un utilisateur enregistre ses propres vues" on report_views
  for insert with check (auth.uid() = user_id);
create policy "Vues visibles par tous" on report_views for select using (true);

-- Signalement de contenu
create policy "Un utilisateur connecté peut signaler un contenu" on report_flags
  for insert with check (auth.uid() = user_id);
create policy "Un admin voit les signalements de contenu" on report_flags
  for select using (
    auth.uid() = user_id
    or exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- Admins : un profil avec is_admin = true peut tout modérer (mise à jour /
-- suppression de n'importe quel signalement). Pour te donner les droits
-- admin, va dans Supabase > Table editor > profiles, trouve ta ligne, et
-- mets la colonne is_admin à true.
create policy "Les admins gèrent tous les signalements" on reports
  for all using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- =========================================================
-- Correctif : mise à jour automatique des compteurs de confirmation
-- =========================================================
-- Problème corrigé : la seule policy "update" sur reports autorise
-- l'auteur du signalement (ou un admin) à le modifier. Or n'importe quel
-- utilisateur connecté doit pouvoir confirmer/infirmer un signalement
-- qui n'est pas le sien. Sans ce trigger, l'appel côté client qui tente
-- de mettre à jour confirmations_up / confirmations_down est bloqué par
-- la RLS et échoue silencieusement : le compteur affiché ne se
-- sauvegarde jamais en base.
-- Solution : un trigger SECURITY DEFINER qui incrémente les compteurs
-- lui-même dès qu'une ligne est insérée dans confirmations, sans passer
-- par une mise à jour "reports" faite depuis le client.
create or replace function increment_report_confirmations()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_still_happening then
    update reports set confirmations_up = confirmations_up + 1 where id = new.report_id;
  else
    update reports set confirmations_down = confirmations_down + 1 where id = new.report_id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_confirmation_insert on confirmations;
create trigger on_confirmation_insert
  after insert on confirmations
  for each row execute function increment_report_confirmations();

-- Même principe pour les commentaires et les partages : un trigger
-- SECURITY DEFINER incrémente le compteur, plutôt qu'un update client
-- qui serait bloqué par la RLS de "reports".
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

create or replace function decrement_report_comments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update reports set comments_count = greatest(0, comments_count - 1) where id = old.report_id;
  return old;
end;
$$;

drop trigger if exists on_comment_delete on comments;
create trigger on_comment_delete
  after delete on comments
  for each row execute function decrement_report_comments();

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

create or replace function increment_report_views()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update reports set views_count = views_count + 1 where id = new.report_id;
  return new;
end;
$$;

drop trigger if exists on_view_insert on report_views;
create trigger on_view_insert
  after insert on report_views
  for each row execute function increment_report_views();
