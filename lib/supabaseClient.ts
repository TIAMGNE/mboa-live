'use client';

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // En développement local sans .env.local rempli, on avertit clairement
  // plutôt que de planter avec une erreur obscure.
  // eslint-disable-next-line no-console
  console.warn(
    'MBOA LIVE : NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY manquants. ' +
    'Copie .env.local.example en .env.local et renseigne tes clés Supabase.'
  );
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
