'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { Report } from '@/lib/types';
import { getCategory } from '@/lib/categories';
import { timeAgo, reliability } from '@/lib/reportUtils';

interface Stats {
  users: number;
  reports: number;
  cities: number;
  confirmations: number;
}

export default function AdminPage() {
  const { profile, loading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    if (!profile?.is_admin) return;

    async function loadAll() {
      const [{ count: users }, { count: reportsCount }, { count: confirmations }, { data: reportRows }] =
        await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('reports').select('*', { count: 'exact', head: true }),
          supabase.from('confirmations').select('*', { count: 'exact', head: true }),
          supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(100)
        ]);

      setStats({
        users: users || 0,
        reports: reportsCount || 0,
        cities: 2,
        confirmations: confirmations || 0
      });
      setReports((reportRows as Report[]) || []);
    }

    loadAll();
  }, [profile]);

  async function removeReport(id: string) {
    await supabase.from('reports').update({ status: 'removed' }).eq('id', id);
    setReports(prev => prev.filter(r => r.id !== id));
  }

  if (loading) return null;

  if (!profile?.is_admin) {
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">Accès réservé</h1>
        <p className="mt-3 text-sm text-dim">
          Cette page est réservée aux administrateurs de MBOA LIVE.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Tableau de bord admin</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Utilisateurs" value={stats?.users} />
        <StatCard label="Signalements" value={stats?.reports} />
        <StatCard label="Villes actives" value={stats?.cities} />
        <StatCard label="Confirmations" value={stats?.confirmations} />
      </div>

      <h2 className="mt-10 font-display text-lg font-bold text-ink">Modération des signalements</h2>
      <div className="mt-4 overflow-hidden rounded-2xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase text-dim">
            <tr>
              <th className="px-4 py-3">Titre</th>
              <th className="px-4 py-3">Catégorie</th>
              <th className="px-4 py-3">Ville</th>
              <th className="px-4 py-3">Fiabilité</th>
              <th className="px-4 py-3">Publié</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {reports.map(r => (
              <tr key={r.id} className="border-t border-line">
                <td className="px-4 py-3 font-medium text-ink">{r.title}</td>
                <td className="px-4 py-3 text-dim">{getCategory(r.category_id).label}</td>
                <td className="px-4 py-3 text-dim">{r.city_id === 'douala' ? 'Douala' : 'Yaoundé'}</td>
                <td className="px-4 py-3 text-dim">{reliability(r)}%</td>
                <td className="px-4 py-3 text-dim">{timeAgo(r.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => removeReport(r.id)}
                    className="rounded-full border border-red/40 px-3 py-1 text-xs font-semibold text-red hover:bg-red/10"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="font-display text-3xl font-bold text-gold">{value ?? '—'}</p>
      <p className="mt-1 text-xs text-dim">{label}</p>
    </div>
  );
}
