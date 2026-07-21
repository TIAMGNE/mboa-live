'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';

export default function Header() {
  const { user, profile } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-3 w-3 items-center justify-center">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-pulseRing rounded-full bg-red" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red" />
            </span>
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            MBOA <span className="text-gold">LIVE</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 font-display text-sm font-medium text-dim md:flex">
          <Link href="/map" className="transition hover:text-ink">Carte live</Link>
          <Link href="/feed" className="transition hover:text-ink">Tendances</Link>
          <Link href="/report" className="transition hover:text-ink">Signaler</Link>
          {profile ? (
            <Link
              href="/profile"
              className="rounded-full border border-line px-4 py-1.5 text-ink transition hover:border-gold"
            >
              {profile.full_name || 'Mon profil'}
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-gold px-4 py-1.5 font-semibold text-bg transition hover:bg-gold-light"
            >
              Se connecter
            </Link>
          )}
        </nav>

        {!user && (
          <Link
            href="/login"
            className="rounded-full bg-gold px-3 py-1.5 font-display text-xs font-bold text-bg md:hidden"
          >
            Connexion
          </Link>
        )}
      </div>
    </header>
  );
}
