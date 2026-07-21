'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { Report } from '@/lib/types';
import ReportCard from '@/components/ReportCard';

export default function ProfilePage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [myReports, setMyReports] = useState<Report[]>([]);

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
        <a href="/login" className="mt-6 inline-block rounded-full bg-gold px-6 py-3 font-display text-sm font-bold text-bg">
          Se connecter
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{profile?.full_name || 'Mon profil'}</h1>
          <p className="mt-1 text-sm text-dim">
            {profile?.city === 'douala' ? 'Douala' : profile?.city === 'yaounde' ? 'Yaoundé' : ''}
          </p>
        </div>
        <button
          onClick={signOut}
          className="rounded-full border border-line px-4 py-2 font-display text-xs font-semibold text-dim hover:text-red"
        >
          Déconnexion
        </button>
      </div>

      <div className="mt-6 flex gap-6 rounded-2xl border border-line bg-surface p-5">
        <div>
          <p className="font-display text-2xl font-bold text-gold">{profile?.trust_score ?? 0}</p>
          <p className="text-xs text-dim">Score de confiance</p>
        </div>
        <div>
          <p className="font-display text-2xl font-bold text-ink">{myReports.length}</p>
          <p className="text-xs text-dim">Signalements publiés</p>
        </div>
      </div>

      <h2 className="mt-10 font-display text-lg font-bold text-ink">Mes signalements</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {myReports.map(report => (
          <ReportCard key={report.id} report={report} />
        ))}
        {myReports.length === 0 && (
          <p className="text-sm text-dim">Tu n&apos;as encore publié aucun signalement.</p>
        )}
      </div>
    </div>
  );
}
