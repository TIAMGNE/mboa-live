'use client';

import { useState } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './useAuth';

export function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 >= 100 ? 1 : 0)}K`;
  return String(n);
}

export function useLike(reportId: string, initialCount: number) {
  const { user } = useAuth();
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);

  async function like() {
    if (!user || busy || liked) return;
    setBusy(true);
    setLiked(true);
    setCount(v => v + 1);
    await supabase
      .from('confirmations')
      .insert({ report_id: reportId, user_id: user.id, is_still_happening: true });
    // En cas d'erreur (déjà aimé précédemment, contrainte unique) on laisse
    // l'état "aimé" affiché : ce n'est pas une vraie erreur pour l'utilisateur.
    setBusy(false);
  }

  return { count, liked, like, canLike: !!user };
}
