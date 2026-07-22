'use client';

import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './useAuth';

/** Rejoint un canal de présence global : chaque utilisateur connecté à l'app
 * "pointe" sa présence, sans jamais écrire en base de données. Le statut
 * en ligne est donc gratuit en charge serveur, quel que soit le nombre
 * d'utilisateurs — c'est fait pour ça. */
export function usePresence() {
  const { user, profile } = useAuth();
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      setOnlineIds(new Set());
      return;
    }

    const channel = supabase.channel('presence-online', {
      config: { presence: { key: user.id } }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineIds(new Set(Object.keys(state)));
      })
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString(), name: profile?.full_name });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile?.full_name]);

  return { onlineIds, isOnline: (userId: string) => onlineIds.has(userId) };
}
