'use client';

import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export function useFollowing(userId?: string) {
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!userId) {
      setFollowingIds(new Set());
      setLoading(false);
      return;
    }
    const { data } = await supabase.from('follows').select('following_id').eq('follower_id', userId);
    setFollowingIds(new Set((data || []).map(r => r.following_id as string)));
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function toggleFollow(targetUserId: string) {
    if (!userId || userId === targetUserId) return false;
    const alreadyFollowing = followingIds.has(targetUserId);

    setFollowingIds(prev => {
      const next = new Set(prev);
      if (alreadyFollowing) next.delete(targetUserId);
      else next.add(targetUserId);
      return next;
    });

    const { error } = alreadyFollowing
      ? await supabase.from('follows').delete().eq('follower_id', userId).eq('following_id', targetUserId)
      : await supabase.from('follows').insert({ follower_id: userId, following_id: targetUserId });

    if (error) {
      // L'action a réellement échoué : on annule le changement visuel pour
      // ne pas laisser le bouton dans un état qui ne reflète pas la réalité.
      setFollowingIds(prev => {
        const next = new Set(prev);
        if (alreadyFollowing) next.add(targetUserId);
        else next.delete(targetUserId);
        return next;
      });
      // eslint-disable-next-line no-console
      console.error('MBOA LIVE — erreur abonnement :', error.message);
      return false;
    }
    return true;
  }

  return { followingIds, loading, toggleFollow, refresh: load };
}

/** Compte simple abonnés / abonnements pour la page profil. */
export function useFollowCounts(userId?: string) {
  const [counts, setCounts] = useState({ followers: 0, following: 0 });

  useEffect(() => {
    let active = true;
    if (!userId) {
      setCounts({ followers: 0, following: 0 });
      return;
    }
    async function load() {
      const [{ count: followers }, { count: following }] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId)
      ]);
      if (active) setCounts({ followers: followers || 0, following: following || 0 });
    }
    load();
    return () => {
      active = false;
    };
  }, [userId]);

  return counts;
}
