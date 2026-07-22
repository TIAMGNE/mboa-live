'use client';

import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { Report, CityId } from './types';
import { isStillVisible } from './reportUtils';

const SELECT_WITH_AUTHOR = '*, author:profiles!user_id(full_name, username, avatar_url)';

export function useReports(cityId?: CityId) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      let query = supabase
        .from('reports')
        .select(SELECT_WITH_AUTHOR)
        .order('created_at', { ascending: false })
        .limit(200);
      if (cityId) query = query.eq('city_id', cityId);

      const { data, error: queryError } = await query;
      if (!active) return;

      if (queryError) {
        // eslint-disable-next-line no-console
        console.error('MBOA LIVE — erreur de chargement des signalements :', queryError.message);
        setError(queryError.message);
        setLoading(false);
        return;
      }

      setError(null);
      setReports(((data as unknown as Report[]) || []).filter(isStillVisible));
      setLoading(false);
    }

    load();

    // Mises à jour en temps réel : tout nouveau signalement (ou modifié)
    // apparaît immédiatement, sans recharger la page.
    const channel = supabase
      .channel(`reports-realtime-${cityId ?? 'all'}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        load();
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [cityId]);

  return { reports, loading, error };
}
