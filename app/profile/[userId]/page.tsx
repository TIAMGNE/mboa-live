'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { useFollowCounts } from '@/lib/useFollows';
import { Report, Profile } from '@/lib/types';
import MediaThumbnail from '@/components/MediaThumbnail';

export default function PublicProfilePage({ params }: { params: { userId: string } }) {
  const { userId } = params;
  const { user } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const counts = useFollowCounts(userId);

  // Si on regarde son propre profil via ce lien, on renvoie vers la page
  // /profile habituelle (qui a en plus les boutons d'édition/paramètres).
  useEffect(() => {
    if (user && user.id === userId) {
      router.replace('/profile');
    }
  }, [user, userId, router]);

  useEffect(() => {
    let active = true;
    async function load() {
      const [{ data: profileRow }, { data: reportRows }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase
          .from('reports')
          .select('*')
          .eq('user_id', userId)
          .neq('status', 'removed')
          .order('created_at', { ascending: false })
      ]);
      if (!active) return;
      if (!profileRow) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setProfile(profileRow as Profile);
      setReports((reportRows as Report[]) || []);
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [userId]);

  if (loading) {
    return <div className="mx-auto max-w-2xl px-5 py-10 text-sm text-dim">Chargement...</div>;
  }

  if (notFound || !profile) {
    return (
      <div className="mx-auto max-w-sm px-5 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">Profil introuvable</h1>
        <p className="mt-3 text-sm text-dim">Ce compte n&apos;existe pas ou plus.</p>
      </div>
    );
  }

  const handle = profile.username ? `@${profile.username}` : null;
  const initial = (profile.full_name || 'U').trim().charAt(0).toUpperCase();
  const cityLabel = profile.city === 'douala' ? 'Douala' : profile.city === 'yaounde' ? 'Yaoundé' : null;

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-line bg-surface font-display text-xl font-bold text-ink">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt={profile.full_name || ''} className="h-full w-full object-cover" />
          ) : (
            initial
          )}
        </span>
        <div className="flex-1">
          <h1 className="font-display text-lg font-bold text-ink">{profile.full_name || 'Utilisateur MBOA'}</h1>
          {handle && <p className="text-sm text-dim">{handle}</p>}
          {cityLabel && <p className="text-xs text-dim">📍 {cityLabel}</p>}
        </div>
      </div>

      {profile.bio && <p className="mt-4 text-sm text-ink">{profile.bio}</p>}

      <div className="mt-5 flex gap-6 text-sm">
        <div>
          <span className="font-display font-bold text-ink">{reports.length}</span>{' '}
          <span className="text-dim">Publications</span>
        </div>
        <div>
          <span className="font-display font-bold text-ink">{counts.followers}</span>{' '}
          <span className="text-dim">Abonnés</span>
        </div>
        <div>
          <span className="font-display font-bold text-ink">{counts.following}</span>{' '}
          <span className="text-dim">Abonnements</span>
        </div>
      </div>

      <h2 className="mt-8 font-display text-sm font-bold text-ink">Publications</h2>
      {reports.length === 0 ? (
        <p className="mt-3 text-sm text-dim">Aucune publication pour l&apos;instant.</p>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-1.5">
          {reports.map(r => (
            <a key={r.id} href={`/feed?report=${r.id}`} className="aspect-square overflow-hidden rounded-lg bg-surface2">
              {r.media_urls?.[0] ? (
                <MediaThumbnail
                  url={r.media_urls[0]}
                  mediaType={r.media_type}
                  alt={r.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-2xl">📍</div>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
