'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface UserResult {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

export default function NewConversationSheet({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .or(`full_name.ilike.%${query.trim()}%,username.ilike.%${query.trim()}%`)
        .limit(15);
      setResults((data as UserResult[]) || []);
      setSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  async function startConversation(targetId: string) {
    setStarting(targetId);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc('get_or_create_direct_conversation', {
      other_user_id: targetId
    });
    setStarting(null);
    if (rpcError || !data) {
      setError("Impossible de démarrer la conversation. Réessaie.");
      return;
    }
    onClose();
    router.push(`/messages/${data}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 md:items-center" onClick={onClose}>
      <div
        className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-t-3xl border-t border-line bg-surface md:rounded-3xl md:border"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="font-display text-sm font-bold text-ink">Nouveau message</h3>
          <button onClick={onClose} aria-label="Fermer" className="text-dim hover:text-ink">✕</button>
        </div>

        <div className="px-5 py-4">
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Chercher par nom ou @pseudo..."
            className="w-full rounded-xl border border-line bg-surface2 px-4 py-3 text-sm text-ink outline-none focus:border-red"
          />
        </div>

        {error && <p className="px-5 text-sm text-red-light">{error}</p>}
        {searching && <p className="px-5 text-xs text-dim">Recherche...</p>}

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {results.map(u => (
            <button
              key={u.id}
              type="button"
              onClick={() => startConversation(u.id)}
              disabled={starting === u.id}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-surface2 disabled:opacity-60"
            >
              {u.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={u.avatar_url} alt={u.full_name || ''} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface2 font-display text-sm font-bold text-ink">
                  {(u.full_name || 'U').charAt(0).toUpperCase()}
                </span>
              )}
              <div>
                <p className="font-display text-sm font-bold text-ink">{u.full_name || 'Utilisateur MBOA'}</p>
                {u.username && <p className="text-xs text-dim">@{u.username}</p>}
              </div>
              {starting === u.id && <span className="ml-auto text-xs text-dim">...</span>}
            </button>
          ))}
          {query.trim().length >= 2 && !searching && results.length === 0 && (
            <p className="px-3 py-4 text-sm text-dim">Personne trouvé.</p>
          )}
        </div>
      </div>
    </div>
  );
}
