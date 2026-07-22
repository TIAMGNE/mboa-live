'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/useAuth';

export default function ConfirmButtons({
  reportId,
  confirmationsUp,
  confirmationsDown
}: {
  reportId: string;
  confirmationsUp: number;
  confirmationsDown: number;
}) {
  const { user } = useAuth();
  const [up, setUp] = useState(confirmationsUp);
  const [down, setDown] = useState(confirmationsDown);
  const [answered, setAnswered] = useState<null | boolean>(null);
  const [busy, setBusy] = useState(false);

  async function confirm(isStillHappening: boolean) {
    if (!user || busy || answered !== null) return;
    setBusy(true);
    const { error } = await supabase.from('confirmations').insert({
      report_id: reportId,
      user_id: user.id,
      is_still_happening: isStillHappening
    });
    setBusy(false);
    if (error) return; // ex : a déjà confirmé (contrainte unique)
    setAnswered(isStillHappening);
    // Le compteur réel est incrémenté en base par un trigger côté serveur
    // (voir supabase/schema.sql). On l'incrémente ici aussi juste pour
    // un affichage immédiat, sans attendre le prochain rechargement.
    if (isStillHappening) setUp(v => v + 1);
    else setDown(v => v + 1);
  }

  return (
    <div className="rounded-xl border border-line bg-surface2 p-3">
      <p className="mb-2 font-display text-xs font-semibold text-dim">
        Cette information est-elle toujours d&apos;actualité ?
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => confirm(true)}
          disabled={!user || answered !== null}
          className={`flex-1 rounded-lg border px-3 py-2 font-display text-xs font-bold transition ${
            answered === true
              ? 'border-green bg-green/15 text-green'
              : 'border-line text-ink hover:border-green hover:text-green disabled:opacity-40'
          }`}
        >
          ✓ Oui, toujours en cours ({up})
        </button>
        <button
          type="button"
          onClick={() => confirm(false)}
          disabled={!user || answered !== null}
          className={`flex-1 rounded-lg border px-3 py-2 font-display text-xs font-bold transition ${
            answered === false
              ? 'border-red bg-red/15 text-red'
              : 'border-line text-ink hover:border-red hover:text-red disabled:opacity-40'
          }`}
        >
          ✕ Non, c&apos;est terminé ({down})
        </button>
      </div>
      {!user && (
        <p className="mt-2 text-[11px] text-dim">Connecte-toi pour confirmer cette information.</p>
      )}
    </div>
  );
}
