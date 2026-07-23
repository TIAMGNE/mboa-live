'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { useUnreadCount } from '@/lib/useNotifications';
import CreateSheet from './CreateSheet';

const ITEMS = [
  { href: '/', label: 'Accueil', icon: HomeIcon },
  { href: '/feed', label: 'Signalements', icon: AlertIcon },
  { href: '/report', label: 'Signaler', icon: PlusIcon, isCta: true },
  { href: '/notifications', label: 'Notifications', icon: BellIcon, showBadge: true },
  { href: '/profile', label: 'Profil', icon: UserIcon }
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const unread = useUnreadCount(user?.id);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 items-center px-3 py-2">
        {ITEMS.map(({ href, label, icon: Icon, isCta, showBadge }) => {
          const active = pathname === href;
          if (isCta) {
            return (
              <button
                key={href}
                onClick={() => setCreateOpen(true)}
                className="flex flex-col items-center justify-self-center gap-1 -mt-6"
                aria-label={label}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red text-ink shadow-lg shadow-red/30">
                  <Icon />
                </span>
              </button>
            );
          }
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex w-full flex-col items-center justify-self-center gap-1 px-1 py-1.5 text-[11px] font-medium ${
                active ? 'text-red' : 'text-dim'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <span className="relative">
                <Icon />
                {showBadge && unread > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red px-1 text-[9px] font-bold text-ink">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </span>
              <span className="block max-w-full truncate text-center">{label}</span>
            </Link>
          );
        })}
      </div>
      {createOpen && <CreateSheet onClose={() => setCreateOpen(false)} />}
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" />
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l9 16H3l9-16z" /><path d="M12 10v4" /><circle cx="12" cy="17.5" r="0.5" fill="currentColor" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M9.5 20a2.5 2.5 0 0 0 5 0" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}
