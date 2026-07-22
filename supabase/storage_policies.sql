-- =========================================================
-- MBOA LIVE — Autorisations du bucket "reports-media"
-- À exécuter APRÈS avoir créé le bucket "reports-media"
-- (Storage → New bucket → nom "reports-media" → Public bucket coché)
-- =========================================================

-- Sans ces policies, l'upload depuis le site échoue silencieusement :
-- le signalement se publie quand même, mais sans photo/vidéo.

-- Lecture publique (nécessaire pour que les photos/vidéos s'affichent sur le site)
create policy "Médias des signalements visibles par tous"
  on storage.objects for select
  using (bucket_id = 'reports-media');

-- Upload réservé aux utilisateurs connectés, uniquement dans leur propre dossier
-- (le code de l'app range chaque fichier sous userId/nomdefichier)
create policy "Un utilisateur connecté peut envoyer ses médias"
  on storage.objects for insert
  with check (
    bucket_id = 'reports-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- =========================================================
-- Bucket "avatars" (photos de profil)
-- À créer d'abord : Storage → New bucket → nom "avatars" → Public bucket coché
-- =========================================================
create policy "Avatars visibles par tous"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Un utilisateur connecté peut envoyer son avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Un utilisateur connecté peut remplacer son avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- =========================================================
-- Bucket "messages-media" (photos, vidéos, notes vocales des messages)
-- À créer d'abord : Storage → New bucket → nom "messages-media" → Public bucket coché
-- (Public simplifie l'affichage ; les liens restent longs et non-devinables,
-- donc pas indexés/listés nulle part publiquement)
-- =========================================================
create policy "Médias des messages visibles par tous ceux qui ont le lien"
  on storage.objects for select
  using (bucket_id = 'messages-media');

create policy "Un utilisateur connecté peut envoyer un média de message"
  on storage.objects for insert
  with check (
    bucket_id = 'messages-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
