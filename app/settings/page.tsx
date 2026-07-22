'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabaseClient';

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

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
    </div>
  );
}
