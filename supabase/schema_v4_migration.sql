-- =========================================================
-- MBOA LIVE — Migration v4 : type de média fiable
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- =========================================================

-- Avant : l'app devinait "photo ou vidéo" en regardant l'extension du
-- fichier dans son URL — peu fiable. On stocke maintenant le vrai type
-- choisi par l'utilisateur au moment de la publication.
alter table reports add column if not exists media_type text check (media_type in ('photo', 'video'));
