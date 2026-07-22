'use client';

import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export function useBlockedUsers(userId?: string) {
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!userId) {
      setBlockedIds(new Set());
      setLoading(false);
      return;
    }
    const { data } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', userId);
    setBlockedIds(new Set((data || []).map(r => r.blocked_id as string)));
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function block(targetUserId: string) {
    if (!userId) return;
    setBlockedIds(prev => new Set(prev).add(targetUserId));
    await supabase.from('blocks').insert({ blocker_id: userId, blocked_id: targetUserId });
  }

  async function unblock(targetUserId: string) {
    if (!userId) return;
    setBlockedIds(prev => {
      const next = new Set(prev);
      next.delete(targetUserId);
      return next;
    });
    await supabase.from('blocks').delete().eq('blocker_id', userId).eq('blocked_id', targetUserId);
  }

  return { blockedIds, loading, block, unblock, isBlocked: (id: string) => blockedIds.has(id) };
}
