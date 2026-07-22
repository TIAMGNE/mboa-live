-- =========================================================
-- MBOA LIVE — Migration v7 : activation du temps réel
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- =========================================================
--
-- Piège classique : une table créée via le SQL Editor (comme toutes les
-- nôtres) n'est PAS automatiquement diffusée en temps réel — contrairement
-- à une table créée depuis l'interface graphique Supabase. Il faut
-- l'ajouter explicitement à la publication "supabase_realtime".
-- Ce script est sûr à rejouer : il ignore les tables déjà présentes.

do $$
declare
  t text;
begin
  foreach t in array array['reports', 'comments', 'notifications', 'confirmations', 'messages', 'conversation_participants', 'conversations']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
