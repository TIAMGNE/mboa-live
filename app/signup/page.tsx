'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { CITIES } from '@/lib/categories';
import { CityId } from '@/lib/types';
import FormField from '@/components/FormField';
import Logo from '@/components/Logo';

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
              className="mt-6 inline-block rounded-full bg-red px-6 py-3 font-display text-sm font-bold text-ink"
            >
              Se connecter
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-5 py-14">
      <div className="flex justify-center">
        <Logo size={48} />
      </div>
      <h1 className="mt-5 text-center font-display text-2xl font-bold text-ink">Inscription</h1>
      <p className="mt-1 text-center text-sm text-dim">Créez votre compte MBOA LIVE.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <FormField
          icon="user"
          required
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          placeholder="Nom complet"
        />
        <FormField
          icon="mail"
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
        />
        <FormField
          icon="phone"
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="Téléphone (optionnel)"
        />
        <FormField
          icon="lock"
          isPassword
          required
          minLength={6}
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Mot de passe (6 caractères min.)"
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
                  city === c.id ? 'border-red bg-red/15 text-red' : 'border-line text-dim'
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
          className="w-full rounded-full bg-red py-3 font-display text-sm font-bold text-ink disabled:opacity-60"
        >
          {loading ? 'Création...' : "S'inscrire"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-dim">
        Déjà un compte ?{' '}
        <Link href="/login" className="font-semibold text-red">
          Se connecter
        </Link>
      </p>

      <div className="my-6 flex items-center gap-3 text-xs text-dim">
        <span className="h-px flex-1 bg-line" /> ou continuer avec <span className="h-px flex-1 bg-line" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="rounded-full border border-line py-2.5 font-display text-xs font-bold text-ink transition hover:border-red"
        >
          Google
        </button>
        <button
          type="button"
          className="rounded-full border border-line py-2.5 font-display text-xs font-bold text-ink transition hover:border-red"
        >
          Facebook
        </button>
      </div>
    </div>
  );
}
