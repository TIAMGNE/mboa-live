'use client';

import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { Conversation } from './types';

export function useConversations(userId?: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!userId) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // 1. Mes conversations, triées par activité récente.
    const { data: myRows, error: convError } = await supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at, conversations(*)')
      .eq('user_id', userId);

    if (convError) {
      setError(convError.message);
      setLoading(false);
      return;
    }

    const convIds = (myRows || []).map(r => r.conversation_id as string);
    if (convIds.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // 2. Tous les participants de ces conversations (peu de lignes : 2 par
    // discussion privée), pour afficher qui est en face.
    const { data: participantRows } = await supabase
      .from('conversation_participants')
      .select('conversation_id, user_id, last_read_at, muted, profile:profiles!user_id(full_name, username, avatar_url)')
      .in('conversation_id', convIds);

    const list: Conversation[] = (myRows || [])
      .map(row => {
        const conv = row.conversations as unknown as Conversation;
        if (!conv) return null;
        const participants = (participantRows || [])
          .filter(p => p.conversation_id === row.conversation_id)
          .map(p => ({
            user_id: p.user_id as string,
            last_read_at: p.last_read_at as string,
            muted: p.muted as boolean,
            profile: p.profile as unknown as Conversation['participants'][number]['profile']
          }));
        return { ...conv, participants };
      })
      .filter(Boolean) as Conversation[];

    list.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
    setError(null);
    setConversations(list);
    setLoading(false);
  }

  useEffect(() => {
    load();
    if (!userId) return;

    // Toute nouvelle conversation ou tout nouveau message met la liste à jour.
    const channel = supabase
      .channel(`conversations-${userId}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_participants', filter: `user_id=eq.${userId}` }, () => load())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const unreadCount = conversations.filter(c => {
    const me = c.participants.find(p => p.user_id === userId);
    if (!me) return false;
    return new Date(c.last_message_at) > new Date(me.last_read_at) && c.last_message_sender_id !== userId;
  }).length;

  return { conversations, loading, error, unreadCount, refresh: load };
}
