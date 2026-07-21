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
  ('traffic',   'Embouteillage',      '🚗', '#E8B33D'),
  ('accident',  'Accident',           '🚨', '#E2453D'),
  ('road',      'Route bloquée',      '🚧', '#E2453D'),
  ('event',     'Événement',          '🎉', '#2E9E6D'),
  ('concert',   'Concert',            '🎤', '#2E9E6D'),
  ('restaurant','Restaurant',         '🍽️', '#F4C862'),
  ('business',  'Commerce',           '🏪', '#F4C862'),
  ('promo',     'Promotion',          '🏷️', '#2E9E6D'),
  ('flood',     'Inondation',         '🌊', '#E2453D'),
  ('power',     'Coupure électricité','💡', '#E8B33D'),
  ('water',     'Problème d''eau',    '🚰', '#E8B33D'),
  ('incident',  'Incident',           '⚠️', '#E2453D'),
  ('other',     'Autre',              '📍', '#9CA6A0')
on conflict (id) do nothing;

-- ---------- Profils utilisateurs (lié à auth.users) ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
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
  status text not null default 'active' check (status in ('active', 'resolved', 'removed')),
  confirmations_up int not null default 0,
  confirmations_down int not null default 0,
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
  content text not null,
  created_at timestamptz not null default now()
);

-- ---------- Notifications ----------
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- =========================================================
-- Row Level Security (RLS)
-- =========================================================
alter table profiles enable row level security;
alter table reports enable row level security;
alter table confirmations enable row level security;
alter table comments enable row level security;
alter table notifications enable row level security;

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

-- Admins : un profil avec is_admin = true peut tout modérer (mise à jour /
-- suppression de n'importe quel signalement). Pour te donner les droits
-- admin, va dans Supabase > Table editor > profiles, trouve ta ligne, et
-- mets la colonne is_admin à true.
create policy "Les admins gèrent tous les signalements" on reports
  for all using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );
