'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { Profile } from './types';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, profile: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, profile: null, loading: true });

  useEffect(() => {
    let active = true;

    async function loadProfile(user: User): Promise<Profile | null> {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();

      if (error) {
        // eslint-disable-next-line no-console
        console.error('MBOA LIVE — erreur de chargement du profil :', error.message);
        return null;
      }

      if (data) return data as Profile;

      // Le compte existe (connexion réussie) mais aucune ligne de profil
      // n'a été créée — ça peut arriver après un test interrompu. On en
      // crée une minimale à la volée pour ne pas rester bloqué.
      const { data: created, error: createError } = await supabase
        .from('profiles')
        .upsert({ id: user.id, full_name: (user.user_metadata?.full_name as string) || null })
        .select('*')
        .maybeSingle();

      if (createError) {
        // eslint-disable-next-line no-console
        console.error('MBOA LIVE — impossible de créer le profil manquant :', createError.message);
        return null;
      }

      return created as Profile | null;
    }

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      const user = data.session?.user ?? null;
      const profile = user ? await loadProfile(user) : null;
      if (active) setState({ user, profile, loading: false });
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      const profile = user ? await loadProfile(user) : null;
      if (active) setState({ user, profile, loading: false });
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
