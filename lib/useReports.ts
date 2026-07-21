'use client';

import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { Report, CityId } from './types';
import { isStillVisible } from './reportUtils';

export function useReports(cityId?: CityId) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      let query = supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (cityId) query = query.eq('city_id', cityId);

      const { data } = await query;
      if (active && data) {
        setReports((data as Report[]).filter(isStillVisible));
        setLoading(false);
      }
    }

    load();

    // Mises à jour en temps réel : tout nouveau signalement (ou modifié)
    // apparaît immédiatement, sans recharger la page.
    const channel = supabase
      .channel('reports-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        load();
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [cityId]);

  return { reports, loading };
}
