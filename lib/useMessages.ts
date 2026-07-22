'use client';

import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { Message } from './types';

const PAGE_SIZE = 40;

export function useMessages(conversationId: string | null, userId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadInitial() {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }

    const rows = ((data as Message[]) || []).reverse();
    setMessages(rows);
    setHasMore(rows.length === PAGE_SIZE);
    setError(null);
    setLoading(false);
  }

  async function loadMore() {
    if (!conversationId || messages.length === 0) return;
    const oldest = messages[0].created_at;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .lt('created_at', oldest)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    const rows = ((data as Message[]) || []).reverse();
    setMessages(prev => [...rows, ...prev]);
    setHasMore(rows.length === PAGE_SIZE);
  }

  useEffect(() => {
    loadInitial();
    if (!conversationId) return;

    // Canal scopé à CETTE conversation uniquement — pas d'écoute globale sur
    // toute la table "messages", ce qui resterait léger même à très grande échelle.
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        payload => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  async function sendMessage(content: string | null, mediaUrl: string | null, mediaType: Message['media_type']) {
    if (!conversationId || !userId) return;
    if (!content?.trim() && !mediaUrl) return;
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: userId,
      content: content?.trim() || null,
      media_url: mediaUrl,
      media_type: mediaType
    });
  }

  async function markAsRead() {
    if (!conversationId || !userId) return;
    await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);
  }

  return { messages, loading, hasMore, error, sendMessage, markAsRead, loadMore };
}
