'use client';

import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { Report } from './types';

export function useFavoriteIds(userId?: string) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!userId) {
      setFavoriteIds(new Set());
      setLoading(false);
      return;
    }
    const { data } = await supabase.from('favorites').select('report_id').eq('user_id', userId);
    setFavoriteIds(new Set((data || []).map(r => r.report_id as string)));
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function toggleFavorite(reportId: string) {
    if (!userId) return;
    const isFav = favoriteIds.has(reportId);

    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (isFav) next.delete(reportId);
      else next.add(reportId);
      return next;
    });

    if (isFav) {
      await supabase.from('favorites').delete().eq('user_id', userId).eq('report_id', reportId);
    } else {
      await supabase.from('favorites').insert({ user_id: userId, report_id: reportId });
    }
  }

  return { favoriteIds, loading, toggleFavorite };
}

/** Signalements complets mis en favoris par l'utilisateur, pour la page "Mes favoris". */
export function useFavoriteReports(userId?: string) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!userId) {
      setReports([]);
      setLoading(false);
      return;
    }
    async function load() {
      const { data } = await supabase
        .from('favorites')
        .select('created_at, report:reports(*, author:profiles!user_id(full_name, username, avatar_url))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (active) {
        setReports(((data || []).map(r => r.report).filter(Boolean) as unknown as Report[]));
        setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [userId]);

  return { reports, loading };
}
