'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/useAuth';

const REASONS: { value: string; label: string }[] = [
  { value: 'spam', label: 'Spam ou publicité' },
  { value: 'harcelement', label: 'Harcèlement' },
  { value: 'violence', label: 'Violence' },
  { value: 'inapproprie', label: 'Contenu inapproprié' },
  { value: 'autre', label: 'Autre raison' }
];

export default function ReportFlagSheet({ reportId, onClose }: { reportId: string; onClose: () => void }) {
  const { user } = useAuth();
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!user || !reason) return;
    setSending(true);
    setError(null);
    const { error: insertError } = await supabase.from('report_flags').insert({
      report_id: reportId,
      user_id: user.id,
      reason,
      details: details.trim() || null
    });
    setSending(false);
    if (insertError) {
      if (insertError.code === '23505') {
        setError('Tu as déjà signalé ce contenu.');
      } else {
        setError("Le signalement n'a pas pu être envoyé. Réessaie.");
      }
      return;
    }
    setDone(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-3xl border-t border-line bg-surface p-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-sm font-bold text-ink">Signaler ce contenu</h3>
          <button onClick={onClose} aria-label="Fermer" className="text-dim hover:text-ink">✕</button>
        </div>

        {done ? (
          <p className="py-6 text-center text-sm text-dim">
            Merci, ton signalement a été transmis à l&apos;équipe de modération. ✓
          </p>
        ) : !user ? (
          <p className="py-6 text-center text-sm text-dim">Connecte-toi pour signaler ce contenu.</p>
        ) : (
          <>
            <div className="space-y-2">
              {REASONS.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setReason(r.value)}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                    reason === r.value ? 'border-red bg-red/10 text-red' : 'border-line text-ink hover:border-red/50'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {reason && (
              <textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                placeholder="Ajoute des détails (optionnel)..."
                rows={3}
                className="mt-3 w-full rounded-xl border border-line bg-surface2 px-4 py-3 text-sm text-ink outline-none focus:border-red"
              />
            )}

            {error && <p className="mt-3 text-sm text-red-light">{error}</p>}

            <button
              type="button"
              onClick={submit}
              disabled={!reason || sending}
              className="mt-4 w-full rounded-full bg-red py-3 font-display text-sm font-bold text-ink disabled:opacity-50"
            >
              {sending ? 'Envoi...' : 'Envoyer le signalement'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
