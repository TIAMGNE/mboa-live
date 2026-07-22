-- =========================================================
-- MBOA LIVE — Migration v5 : module vidéo & interactions avancées
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- =========================================================

-- ---------- 1. Vues ----------
alter table reports add column if not exists views_count int not null default 0;

create table if not exists report_views (
  report_id uuid not null references reports(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (report_id, user_id)
);

alter table report_views enable row level security;
drop policy if exists "Un utilisateur enregistre ses propres vues" on report_views;
create policy "Un utilisateur enregistre ses propres vues" on report_views
  for insert with check (auth.uid() = user_id);
drop policy if exists "Vues visibles par tous" on report_views;
create policy "Vues visibles par tous" on report_views for select using (true);

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

-- ---------- 2. Réponses aux commentaires + édition/suppression ----------
alter table comments add column if not exists parent_id uuid references comments(id) on delete cascade;
alter table comments add column if not exists edited boolean not null default false;

drop policy if exists "Un utilisateur modifie son propre commentaire" on comments;
create policy "Un utilisateur modifie son propre commentaire" on comments
  for update using (auth.uid() = user_id);
drop policy if exists "Un utilisateur supprime son propre commentaire" on comments;
create policy "Un utilisateur supprime son propre commentaire" on comments
  for delete using (auth.uid() = user_id);

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

-- ---------- 3. Signalement de contenu (spam, harcèlement, violence, etc.) ----------
create table if not exists report_flags (
  id uuid primary key default uuid_generate_v4(),
  report_id uuid not null references reports(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  reason text not null check (reason in ('spam', 'harcelement', 'violence', 'inapproprie', 'autre')),
  details text,
  created_at timestamptz not null default now(),
  unique (report_id, user_id)
);

alter table report_flags enable row level security;
drop policy if exists "Un utilisateur connecté peut signaler un contenu" on report_flags;
create policy "Un utilisateur connecté peut signaler un contenu" on report_flags
  for insert with check (auth.uid() = user_id);
drop policy if exists "Un admin voit les signalements de contenu" on report_flags;
create policy "Un admin voit les signalements de contenu" on report_flags
  for select using (
    auth.uid() = user_id
    or exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );
