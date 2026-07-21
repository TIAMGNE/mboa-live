'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { CITIES } from '@/lib/categories';
import { CityId } from '@/lib/types';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState<CityId>('douala');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      phone: phone.trim() || undefined,
      options: { data: { full_name: fullName.trim() } }
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    if (!data.user) {
      setLoading(false);
      setError("Le compte n'a pas pu être créé. Réessaie.");
      return;
    }

    // Confirmation e-mail désactivée : Supabase crée une session immédiatement.
    if (data.session) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName.trim(),
        city
      });

      if (profileError) {
        setLoading(false);
        setError(`Compte créé, mais le profil n'a pas pu être enregistré : ${profileError.message}`);
        return;
      }

      setLoading(false);
      setDone(true);
      return;
    }

    // Confirmation e-mail activée : on affiche ce message uniquement dans ce cas.
    setNeedsEmailConfirmation(true);
    setLoading(false);
    setDone(true);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-sm px-5 py-20 text-center">
        {needsEmailConfirmation ? (
          <>
            <h1 className="font-display text-2xl font-bold text-ink">Vérifie ta boîte mail 📩</h1>
            <p className="mt-3 text-sm text-dim">
              Un e-mail de confirmation vient de t&apos;être envoyé. Clique sur le lien pour activer ton compte MBOA LIVE.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl font-bold text-ink">Compte créé 🎉</h1>
            <p className="mt-3 text-sm text-dim">
              Ton compte MBOA LIVE est prêt. Tu peux maintenant te connecter.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block rounded-full bg-gold px-6 py-3 font-display text-sm font-bold text-bg"
            >
              Se connecter
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-5 py-16">
      <h1 className="font-display text-2xl font-bold text-ink">Créer un compte</h1>
      <p className="mt-1 text-sm text-dim">Rejoins la communauté MBOA LIVE.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input
          required
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          placeholder="Nom complet"
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-gold"
        />
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="E-mail"
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-gold"
        />
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="Téléphone (optionnel)"
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-gold"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Mot de passe (6 caractères min.)"
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-gold"
        />
        <div>
          <label className="mb-2 block font-display text-xs font-bold text-dim">Ta ville</label>
          <div className="flex gap-2">
            {CITIES.map(c => (
              <button
                type="button"
                key={c.id}
                onClick={() => setCity(c.id)}
                className={`rounded-full border px-3 py-1.5 font-display text-xs font-semibold ${
                  city === c.id ? 'border-gold bg-gold/15 text-gold' : 'border-line text-dim'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-red-light">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-gold py-3 font-display text-sm font-bold text-bg disabled:opacity-60"
        >
          {loading ? 'Création...' : 'Créer mon compte'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-dim">
        Déjà inscrit ?{' '}
        <Link href="/login" className="font-semibold text-gold">
          Connecte-toi
        </Link>
      </p>
    </div>
  );
}
