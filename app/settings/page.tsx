'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabaseClient';

export default function SettingsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [deletionRequested, setDeletionRequested] = useState(!!profile?.deletion_requested_at);
  const [deleting, setDeleting] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(false);

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setNewPassword('');
    setConfirmPassword('');
    setDone(true);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  async function requestDeletion() {
    if (!user) return;
    if (!confirm('Confirmer la demande de suppression de ton compte ? Cette action sera traitée par un administrateur.')) return;
    setDeleting(true);
    await supabase.from('profiles').update({ deletion_requested_at: new Date().toISOString() }).eq('id', user.id);
    setDeleting(false);
    setDeletionRequested(true);
  }

  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-sm px-5 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">Pas encore connecté</h1>
        <a href="/login" className="mt-6 inline-block rounded-full bg-red px-6 py-3 font-display text-sm font-bold text-ink">
          Se connecter
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-5 py-10">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} aria-label="Retour" className="text-dim hover:text-ink">←</button>
        <h1 className="font-display text-lg font-bold text-ink">Paramètres</h1>
      </div>

      <div className="mt-8 rounded-2xl border border-line bg-surface p-5">
        <p className="text-xs text-dim">Connecté avec</p>
        <p className="mt-1 font-display text-sm font-bold text-ink">{user?.email}</p>
      </div>

      <h2 className="mt-8 font-display text-sm font-bold text-ink">Changer le mot de passe</h2>
      <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
        <input
          type="password"
          required
          minLength={6}
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          placeholder="Nouveau mot de passe"
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-red"
        />
        <input
          type="password"
          required
          minLength={6}
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          placeholder="Confirmer le mot de passe"
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-red"
        />
        {error && <p className="text-sm text-red-light">{error}</p>}
        {done && <p className="text-sm text-green">Mot de passe mis à jour ✓</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-full bg-red py-3 font-display text-sm font-bold text-ink disabled:opacity-60"
        >
          {saving ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
        </button>
      </form>

      <button
        onClick={signOut}
        className="mt-10 w-full rounded-full border border-red/40 py-3 font-display text-sm font-bold text-red transition hover:bg-red/10"
      >
        Se déconnecter
      </button>

      <div className="mt-10 space-y-2 border-t border-line pt-6 text-center text-xs text-dim">
        <Link href="/terms" className="block hover:text-ink">Conditions générales d&apos;utilisation</Link>
        <Link href="/privacy" className="block hover:text-ink">Politique de confidentialité</Link>
      </div>

      <div className="mt-6 rounded-2xl border border-red/30 bg-red/5 p-4">
        <h2 className="font-display text-sm font-bold text-red">Zone dangereuse</h2>
        {deletionRequested ? (
          <p className="mt-2 text-xs text-dim">
            Ta demande de suppression a bien été enregistrée. Un administrateur va la traiter.
          </p>
        ) : (
          <>
            <p className="mt-2 text-xs text-dim">
              Demande la suppression définitive de ton compte et de tes données.
            </p>
            <button
              onClick={requestDeletion}
              disabled={deleting}
              className="mt-3 rounded-full border border-red px-4 py-2 font-display text-xs font-bold text-red disabled:opacity-60"
            >
              {deleting ? 'Envoi...' : 'Demander la suppression de mon compte'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
