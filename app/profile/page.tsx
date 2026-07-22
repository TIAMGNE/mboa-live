'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { Report } from '@/lib/types';
import { useFollowCounts } from '@/lib/useFollows';
import MediaThumbnail from '@/components/MediaThumbnail';

const MENU = [
  { label: 'Mes signalements', href: '#mes-signalements', icon: '📍' },
  { label: 'Notifications', href: '/notifications', icon: '🔔' },
  { label: 'Mes favoris', href: '/favorites', icon: '⭐' },
  { label: 'Paramètres', href: '/settings', icon: '⚙️' },
  { label: 'À propos', href: '/about', icon: 'ℹ️' }
];

export default function ProfilePage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [myReports, setMyReports] = useState<Report[]>([]);
  const { followers, following } = useFollowCounts(user?.id);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setMyReports((data as Report[]) || []));
  }, [user]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  if (!loading && !user) {
    return (
      <div className="mx-auto max-w-sm px-5 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">Pas encore connecté</h1>
        <a href="/login" className="mt-6 inline-block rounded-full bg-red px-6 py-3 font-display text-sm font-bold text-ink">
          Se connecter
        </a>
      </div>
    );
  }

  const initial = (profile?.full_name || 'U').trim().charAt(0).toUpperCase();
  const handle = profile?.username ? `@${profile.username}` : null;

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-line bg-surface font-display text-xl font-bold text-ink">
            {initial}
          </span>
          <div>
            <h1 className="font-display text-lg font-bold text-ink">{profile?.full_name || 'Mon profil'}</h1>
            {handle && <p className="text-sm text-dim">{handle}</p>}
          </div>
        </div>
        <button onClick={signOut} className="font-display text-xs font-semibold text-red">
          Déconnexion
        </button>
      </div>

      <div className="mt-6 grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-surface py-4 text-center">
        <div>
          <p className="font-display text-xl font-bold text-ink">{myReports.length}</p>
          <p className="mt-1 text-[11px] text-dim">Publications</p>
        </div>
        <div>
          <p className="font-display text-xl font-bold text-ink">{followers}</p>
          <p className="mt-1 text-[11px] text-dim">Abonnés</p>
        </div>
        <div>
          <p className="font-display text-xl font-bold text-ink">{following}</p>
          <p className="mt-1 text-[11px] text-dim">Abonnements</p>
        </div>
      </div>

      <Link
        href="/profile/edit"
        className="mt-4 block w-full rounded-full border border-line py-2.5 text-center font-display text-sm font-bold text-ink transition hover:border-red"
      >
        Modifier le profil
      </Link>

      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-surface">
        {MENU.map((item, i) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center justify-between px-4 py-3.5 text-sm font-medium text-ink transition hover:bg-surface2 ${
              i !== MENU.length - 1 ? 'border-b border-line' : ''
            }`}
          >
            <span className="flex items-center gap-3">
              <span>{item.icon}</span>
              {item.label}
            </span>
            <span className="text-dim">→</span>
          </Link>
        ))}
      </div>

      <h2 id="mes-signalements" className="mt-10 font-display text-lg font-bold text-ink">Mes publications</h2>
      <div className="mt-4 grid grid-cols-3 gap-1.5">
        {myReports.map(report => (
          <Link
            key={report.id}
            href={`/feed?report=${report.id}`}
            className="group relative aspect-[3/4] overflow-hidden rounded-lg bg-surface2"
          >
            {report.media_urls?.[0] ? (
              <MediaThumbnail
                url={report.media_urls[0]}
                mediaType={report.media_type}
                alt={report.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl">📍</div>
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/80 to-transparent px-2 py-2 text-[10px] font-semibold text-ink">
              <span>♡ {report.confirmations_up}</span>
              <span>💬 {report.comments_count}</span>
            </div>
          </Link>
        ))}
        {myReports.length === 0 && (
          <p className="col-span-3 text-sm text-dim">Tu n&apos;as encore publié aucun signalement.</p>
        )}
      </div>
    </div>
  );
}
