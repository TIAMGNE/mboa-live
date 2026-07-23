'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { useMessages } from '@/lib/useMessages';
import { useConversations } from '@/lib/useConversations';
import { usePresence } from '@/lib/usePresence';
import { useBlockedUsers } from '@/lib/useBlocks';
import MessageBubble from '@/components/MessageBubble';
import MessageComposer from '@/components/MessageComposer';

export default function ConversationPage({ params }: { params: { id: string } }) {
  const conversationId = params.id;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { messages, loading, hasMore, sendMessage, markAsRead, loadMore } = useMessages(conversationId, user?.id);
  const { conversations } = useConversations(user?.id);
  const { isOnline } = usePresence();
  const { isBlocked, block, unblock } = useBlockedUsers(user?.id);
  const [menuOpen, setMenuOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversation = conversations.find(c => c.id === conversationId);
  const other = conversation?.participants.find(p => p.user_id !== user?.id);
  const me = conversation?.participants.find(p => p.user_id === user?.id);
  const otherName = other?.profile?.full_name || other?.profile?.username || 'Utilisateur MBOA';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages.length]);

  useEffect(() => {
    markAsRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, messages.length]);

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

  const blocked = other ? isBlocked(other.user_id) : false;

  return (
    <div className="mx-auto flex h-[calc(100vh-132px)] max-w-2xl flex-col md:h-[calc(100vh-53px)]">
      {/* En-tête */}
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <button onClick={() => router.push('/messages')} aria-label="Retour" className="text-dim hover:text-ink">←</button>
        <div className="relative">
          {other?.profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={other.profile.avatar_url} alt={otherName} className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface2 font-display text-xs font-bold text-ink">
              {otherName.charAt(0).toUpperCase()}
            </span>
          )}
          {other && isOnline(other.user_id) && (
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-bg bg-green" />
          )}
        </div>
        <div className="flex-1">
          <p className="font-display text-sm font-bold text-ink">{otherName}</p>
          <p className="text-[11px] text-dim">{other && isOnline(other.user_id) ? 'En ligne' : ''}</p>
        </div>
        <div className="relative">
          <button onClick={() => setMenuOpen(v => !v)} aria-label="Options" className="px-2 text-dim hover:text-ink">⋯</button>
          {menuOpen && (
            <div className="absolute right-0 top-9 z-20 w-48 overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
              {other && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    if (blocked) unblock(other.user_id);
                    else if (confirm(`Bloquer ${otherName} ? Vous ne recevrez plus ses messages.`)) block(other.user_id);
                  }}
                  className="block w-full px-4 py-2.5 text-left text-xs font-semibold text-red hover:bg-surface2"
                >
                  {blocked ? 'Débloquer' : '🚫 Bloquer'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {hasMore && (
          <button onClick={loadMore} className="mx-auto block font-display text-xs font-semibold text-dim hover:text-ink">
            Charger les messages précédents
          </button>
        )}
        {loading && <p className="text-center text-sm text-dim">Chargement...</p>}
        {!loading && messages.length === 0 && (
          <p className="mt-10 text-center text-sm text-dim">
            Dites bonjour à {otherName} 👋
          </p>
        )}
        {messages.map(m => (
          <MessageBubble
            key={m.id}
            message={m}
            isMine={m.sender_id === user?.id}
            isRead={!!me && !!other && new Date(m.created_at) <= new Date(other.last_read_at)}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {blocked ? (
        <div className="border-t border-line px-4 py-4 text-center text-sm text-dim">
          Tu as bloqué {otherName}. Débloque-le pour lui écrire à nouveau.
        </div>
      ) : (
        user && <MessageComposer userId={user.id} onSend={sendMessage} />
      )}
    </div>
  );
}
