-- =========================================================
-- MBOA LIVE — Migration v8 : bio du profil
-- =========================================================
alter table profiles add column if not exists bio text;
