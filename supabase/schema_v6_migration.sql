-- =========================================================
-- MBOA LIVE — Migration v6 : messagerie privée
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- =========================================================
--
-- Choix d'architecture pensés pour bien scaler (des milliers, puis
-- potentiellement des millions d'utilisateurs) :
--
-- 1. Accusés de lecture : PAS de table "read_receipts" avec une ligne par
--    message par participant (ça exploserait en taille avec le nombre de
--    messages × participants). À la place, chaque participant a un simple
--    "last_read_at" : un message est "lu" par quelqu'un si sa date de
--    création est <= au last_read_at de cette personne. Une seule ligne à
--    mettre à jour par personne, quelle que soit la taille de la conversation.
--
-- 2. Statut en ligne : PAS stocké en base du tout. On utilise le Presence
--    de Supabase Realtime (canal en mémoire, pas de table), qui est fait
--    exactement pour ça et ne sollicite jamais la base de données.
--
-- 3. Index sur (conversation_id, created_at) pour que charger les messages
--    d'une conversation reste rapide même avec des millions de messages
--    au total dans la table.

create table if not exists conversations (
  id uuid primary key default uuid_generate_v4(),
  is_group boolean not null default false,
  title text,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  last_message_preview text,
  last_message_sender_id uuid references profiles(id) on delete set null
);

create table if not exists conversation_participants (
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz not null default now(),
  muted boolean not null default false,
  primary key (conversation_id, user_id)
);

create index if not exists conversation_participants_user_idx on conversation_participants (user_id);

create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  content text,
  media_url text,
  media_type text check (media_type in ('image', 'video', 'audio')),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (content is not null or media_url is not null)
);

create index if not exists messages_conversation_created_idx on messages (conversation_id, created_at);

create table if not exists blocks (
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

-- =========================================================
-- Row Level Security
-- =========================================================
alter table conversations enable row level security;
alter table conversation_participants enable row level security;
alter table messages enable row level security;
alter table blocks enable row level security;

-- On ne voit une conversation que si on en fait partie.
drop policy if exists "Voir ses propres conversations" on conversations;
create policy "Voir ses propres conversations" on conversations
  for select using (
    exists (select 1 from conversation_participants cp where cp.conversation_id = id and cp.user_id = auth.uid())
  );
drop policy if exists "Créer une conversation" on conversations;
create policy "Créer une conversation" on conversations for insert with check (true);
drop policy if exists "Mettre à jour une conversation dont on fait partie" on conversations;
create policy "Mettre à jour une conversation dont on fait partie" on conversations
  for update using (
    exists (select 1 from conversation_participants cp where cp.conversation_id = id and cp.user_id = auth.uid())
  );

drop policy if exists "Voir les participants de ses conversations" on conversation_participants;
create policy "Voir les participants de ses conversations" on conversation_participants
  for select using (
    exists (select 1 from conversation_participants cp2 where cp2.conversation_id = conversation_id and cp2.user_id = auth.uid())
  );
drop policy if exists "Rejoindre une conversation" on conversation_participants;
create policy "Rejoindre une conversation" on conversation_participants
  for insert with check (true);
drop policy if exists "Mettre à jour sa propre participation" on conversation_participants;
create policy "Mettre à jour sa propre participation" on conversation_participants
  for update using (auth.uid() = user_id);

drop policy if exists "Voir les messages de ses conversations" on messages;
create policy "Voir les messages de ses conversations" on messages
  for select using (
    exists (select 1 from conversation_participants cp where cp.conversation_id = messages.conversation_id and cp.user_id = auth.uid())
  );
drop policy if exists "Envoyer un message dans ses conversations" on messages;
create policy "Envoyer un message dans ses conversations" on messages
  for insert with check (
    auth.uid() = sender_id
    and exists (select 1 from conversation_participants cp where cp.conversation_id = messages.conversation_id and cp.user_id = auth.uid())
  );
drop policy if exists "Supprimer son propre message" on messages;
create policy "Supprimer son propre message" on messages
  for update using (auth.uid() = sender_id);

drop policy if exists "Voir ses propres blocages" on blocks;
create policy "Voir ses propres blocages" on blocks for select using (auth.uid() = blocker_id);
drop policy if exists "Gérer ses propres blocages" on blocks;
create policy "Gérer ses propres blocages" on blocks
  for all using (auth.uid() = blocker_id) with check (auth.uid() = blocker_id);

-- =========================================================
-- Trigger : last_message_at se met à jour tout seul (pour trier
-- la liste des conversations par activité récente, sans recalculer
-- un MAX(created_at) sur toute la table à chaque affichage)
-- =========================================================
create or replace function touch_conversation_last_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update conversations
  set last_message_at = new.created_at,
      last_message_sender_id = new.sender_id,
      last_message_preview = case
        when new.content is not null then left(new.content, 140)
        when new.media_type = 'image' then '📷 Photo'
        when new.media_type = 'video' then '🎥 Vidéo'
        when new.media_type = 'audio' then '🎤 Note vocale'
        else null
      end
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists on_message_insert on messages;
create trigger on_message_insert
  after insert on messages
  for each row execute function touch_conversation_last_message();

-- =========================================================
-- Fonction utilitaire : démarrer (ou récupérer) une conversation
-- privée entre deux personnes, sans jamais en créer de doublon.
-- =========================================================
create or replace function get_or_create_direct_conversation(other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_id uuid;
  new_id uuid;
begin
  select cp1.conversation_id into existing_id
  from conversation_participants cp1
  join conversation_participants cp2 on cp1.conversation_id = cp2.conversation_id
  join conversations c on c.id = cp1.conversation_id
  where cp1.user_id = auth.uid()
    and cp2.user_id = other_user_id
    and c.is_group = false
  limit 1;

  if existing_id is not null then
    return existing_id;
  end if;

  insert into conversations (is_group) values (false) returning id into new_id;
  insert into conversation_participants (conversation_id, user_id) values (new_id, auth.uid());
  insert into conversation_participants (conversation_id, user_id) values (new_id, other_user_id);

  return new_id;
end;
$$;
