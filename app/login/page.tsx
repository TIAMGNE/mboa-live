'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import FormField from '@/components/FormField';
import Logo from '@/components/Logo';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError('E-mail ou mot de passe incorrect.');
      return;
    }
    router.push('/');
  }

  async function handleOAuth(provider: 'google' | 'facebook') {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  }

  return (
    <div className="mx-auto max-w-sm px-5 py-14">
      <div className="flex justify-center">
        <Logo size={48} />
      </div>
      <h1 className="mt-5 text-center font-display text-2xl font-bold text-ink">Connexion</h1>
      <p className="mt-1 text-center text-sm text-dim">Accède à ton compte MBOA LIVE.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <FormField
          icon="mail"
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="E-mail"
        />
        <FormField
          icon="lock"
          isPassword
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Mot de passe"
        />
        {error && <p className="text-sm text-red-light">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-red py-3 font-display text-sm font-bold text-ink disabled:opacity-60"
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-dim">
        <span className="h-px flex-1 bg-line" /> ou continuer avec <span className="h-px flex-1 bg-line" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleOAuth('google')}
          type="button"
          className="rounded-full border border-line py-2.5 font-display text-xs font-bold text-ink transition hover:border-red"
        >
          Google
        </button>
        <button
          onClick={() => handleOAuth('facebook')}
          type="button"
          className="rounded-full border border-line py-2.5 font-display text-xs font-bold text-ink transition hover:border-red"
        >
          Facebook
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-dim">
        Pas encore de compte ?{' '}
        <Link href="/signup" className="font-semibold text-red">
          Inscris-toi
        </Link>
      </p>
    </div>
  );
}
