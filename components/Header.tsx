'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import Logo, { Wordmark } from './Logo';
import { useUnreadCount } from '@/lib/useNotifications';
import { useConversations } from '@/lib/useConversations';

export default function Header() {
  const { user, profile } = useAuth();
  const unread = useUnreadCount(user?.id);
  const { unreadCount: unreadMessages } = useConversations(user?.id);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-2.5">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={24} />
          <Wordmark className="text-base" />
        </Link>

        <nav className="hidden items-center gap-6 font-display text-sm font-medium text-dim md:flex">
          <Link href="/" className="flex items-center gap-1.5 transition hover:text-ink">
            <span>🏠</span> Accueil
          </Link>
          <Link href="/search" className="flex items-center gap-1.5 transition hover:text-ink">
            <span>🔍</span> Rechercher
          </Link>
          <Link href="/feed" className="flex items-center gap-1.5 transition hover:text-ink">
            <span>⚠️</span> Signalements
          </Link>
          <Link href="/report" className="flex items-center gap-1.5 transition hover:text-ink">
            <span>➕</span> Signaler
          </Link>
          {user && (
            <Link href="/messages" className="relative flex items-center gap-1.5 transition hover:text-ink">
              <span>💬</span> Messages
              {unreadMessages > 0 && (
                <span className="absolute -right-3 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red px-1 text-[9px] font-bold text-ink">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </Link>
          )}
          <Link href="/notifications" className="relative flex items-center gap-1.5 transition hover:text-ink">
            <span>🔔</span> Notifications
            {unread > 0 && (
              <span className="absolute -right-3 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red px-1 text-[9px] font-bold text-ink">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>
          {profile ? (
            <Link
              href="/profile"
              className="flex items-center gap-1.5 rounded-full border border-line px-4 py-1.5 text-ink transition hover:border-red"
            >
              <span>👤</span> {profile.full_name || 'Mon profil'}
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-red px-4 py-1.5 font-semibold text-ink transition hover:bg-red-light"
            >
              Se connecter
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3 md:hidden">
          <Link href="/search" className="text-ink" aria-label="Rechercher">
            🔍
          </Link>
          {user && (
            <Link href="/messages" className="relative text-ink" aria-label="Messages">
              💬
              {unreadMessages > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red px-1 text-[9px] font-bold text-ink">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </Link>
          )}
          {!user && (
            <Link
              href="/login"
              className="rounded-full bg-red px-3 py-1.5 font-display text-xs font-bold text-ink"
            >
              Connexion
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
