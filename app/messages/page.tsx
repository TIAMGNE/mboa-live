'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import { useConversations } from '@/lib/useConversations';
import { usePresence } from '@/lib/usePresence';
import { timeAgo } from '@/lib/reportUtils';
import NewConversationSheet from '@/components/NewConversationSheet';

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const { conversations, loading, error } = useConversations(user?.id);
  const { isOnline } = usePresence();
  const [search, setSearch] = useState('');
  const [newOpen, setNewOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.trim().toLowerCase();
    return conversations.filter(c => {
      const other = c.participants.find(p => p.user_id !== user?.id);
      const name = other?.profile?.full_name || other?.profile?.username || '';
      return name.toLowerCase().includes(q);
    });
  }, [conversations, search, user?.id]);

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
    <div className="mx-auto max-w-2xl px-5 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">Messages</h1>
        <button
          onClick={() => setNewOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-red text-ink"
          aria-label="Nouveau message"
        >
          ✎
        </button>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Rechercher une conversation..."
        className="mt-4 w-full rounded-full border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-red"
      />

      {loading && <p className="mt-6 text-sm text-dim">Chargement...</p>}
      {!loading && error && (
        <p className="mt-6 rounded-lg border border-red/40 bg-red/10 px-4 py-3 text-sm text-red-light">{error}</p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-line p-10 text-center">
          <p className="font-display text-lg font-bold text-ink">Aucune conversation</p>
          <p className="mt-2 text-sm text-dim">Démarre une discussion avec quelqu&apos;un de la communauté.</p>
          <button
            onClick={() => setNewOpen(true)}
            className="mt-4 inline-block rounded-full bg-red px-5 py-2.5 font-display text-sm font-bold text-ink"
          >
            + Nouveau message
          </button>
        </div>
      )}

      <div className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {filtered.map(c => {
          const other = c.participants.find(p => p.user_id !== user?.id);
          const me = c.participants.find(p => p.user_id === user?.id);
          const unread = me ? new Date(c.last_message_at) > new Date(me.last_read_at) && c.last_message_sender_id !== user?.id : false;
          const name = other?.profile?.full_name || other?.profile?.username || 'Utilisateur MBOA';

          return (
            <Link key={c.id} href={`/messages/${c.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface2">
              <div className="relative">
                {other?.profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={other.profile.avatar_url} alt={name} className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface2 font-display text-sm font-bold text-ink">
                    {name.charAt(0).toUpperCase()}
                  </span>
                )}
                {other && isOnline(other.user_id) && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-surface bg-green" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className={`truncate font-display text-sm ${unread ? 'font-bold text-ink' : 'font-semibold text-ink'}`}>{name}</p>
                  <span className="shrink-0 font-mono text-[10px] text-dim">{timeAgo(c.last_message_at)}</span>
                </div>
                <p className={`truncate text-xs ${unread ? 'font-semibold text-ink' : 'text-dim'}`}>
                  {c.last_message_preview || 'Nouvelle conversation'}
                </p>
              </div>
              {unread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red" />}
            </Link>
          );
        })}
      </div>

      {newOpen && <NewConversationSheet onClose={() => setNewOpen(false)} />}
    </div>
  );
}
