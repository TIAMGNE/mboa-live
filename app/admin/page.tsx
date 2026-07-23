'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { Report, ReportStatus } from '@/lib/types';
import { getCategory } from '@/lib/categories';
import { timeAgo } from '@/lib/reportUtils';
import { statusLabel, statusClasses } from '@/lib/statusLabel';

interface Stats {
  users: number;
  reports: number;
  cities: number;
  confirmations: number;
}

const STATUS_LEGEND: { status: ReportStatus; text: string }[] = [
  { status: 'active', text: 'Votre signalement a été reçu et est en attente de traitement.' },
  { status: 'in_progress', text: 'Votre signalement est en cours de traitement par les autorités.' },
  { status: 'resolved', text: 'Le problème a été résolu. Merci pour votre engagement.' }
];

const CYCLE: Record<ReportStatus, ReportStatus> = {
  active: 'in_progress',
  in_progress: 'resolved',
  resolved: 'removed',
  removed: 'active'
};

export default function AdminPage() {
  const { profile, loading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<
    { id: string; full_name: string | null; deletion_requested_at: string }[]
  >([]);

  useEffect(() => {
    if (!profile?.is_admin) return;

    async function loadAll() {
      const [{ count: users }, { count: reportsCount }, { count: confirmations }, { data: reportRows }, { data: deletions }] =
        await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('reports').select('*', { count: 'exact', head: true }),
          supabase.from('confirmations').select('*', { count: 'exact', head: true }),
          supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(100),
          supabase
            .from('profiles')
            .select('id, full_name, deletion_requested_at')
            .not('deletion_requested_at', 'is', null)
            .order('deletion_requested_at', { ascending: true })
        ]);

      setStats({
        users: users || 0,
        reports: reportsCount || 0,
        cities: 2,
        confirmations: confirmations || 0
      });
      setReports((reportRows as Report[]) || []);
      setDeletionRequests(deletions || []);
    }

    loadAll();
  }, [profile]);

  async function cycleStatus(report: Report) {
    const nextStatus = CYCLE[report.status];
    setReports(prev => prev.map(r => (r.id === report.id ? { ...r, status: nextStatus } : r)));
    await supabase.from('reports').update({ status: nextStatus }).eq('id', report.id);
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

      <h2 className="mt-10 font-display text-lg font-bold text-ink">Statuts des signalements</h2>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {STATUS_LEGEND.map(({ status, text }) => (
          <div key={status} className="rounded-2xl border border-line bg-surface p-4">
            <span className={`inline-block rounded-full border px-2.5 py-1 font-display text-[11px] font-bold ${statusClasses(status)}`}>
              {statusLabel(status)}
            </span>
            <p className="mt-2 text-xs text-dim">{text}</p>
          </div>
        ))}
      </div>

      {deletionRequests.length > 0 && (
        <>
          <h2 className="mt-10 font-display text-lg font-bold text-ink">Demandes de suppression de compte</h2>
          <div className="mt-4 space-y-2">
            {deletionRequests.map(d => (
              <div key={d.id} className="flex items-center justify-between rounded-xl border border-red/30 bg-red/5 px-4 py-3">
                <div>
                  <p className="font-display text-sm font-bold text-ink">{d.full_name || 'Utilisateur MBOA'}</p>
                  <p className="text-xs text-dim">Demandé {timeAgo(d.deletion_requested_at)}</p>
                </div>
                <p className="font-mono text-[10px] text-dim">{d.id}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-dim">
            Pour supprimer un compte définitivement : Supabase → Authentication → Users → cherche cet ID → Delete user.
          </p>
        </>
      )}

      <h2 className="mt-10 font-display text-lg font-bold text-ink">Modération des signalements</h2>
      <p className="mt-1 text-xs text-dim">Clique sur le statut d&apos;un signalement pour le faire avancer à l&apos;étape suivante.</p>
      <div className="mt-4 overflow-hidden rounded-2xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase text-dim">
            <tr>
              <th className="px-4 py-3">Titre</th>
              <th className="px-4 py-3">Catégorie</th>
              <th className="px-4 py-3">Ville</th>
              <th className="px-4 py-3">Publié</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(r => (
              <tr key={r.id} className="border-t border-line">
                <td className="px-4 py-3 font-medium text-ink">{r.title}</td>
                <td className="px-4 py-3 text-dim">{getCategory(r.category_id).label}</td>
                <td className="px-4 py-3 text-dim">{r.city_id === 'douala' ? 'Douala' : 'Yaoundé'}</td>
                <td className="px-4 py-3 text-dim">{timeAgo(r.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => cycleStatus(r)}
                    className={`rounded-full border px-3 py-1 font-display text-[11px] font-bold transition ${statusClasses(r.status)}`}
                    title="Cliquer pour changer le statut"
                  >
                    {statusLabel(r.status)}
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
      <p className="font-display text-3xl font-bold text-red">{value ?? '—'}</p>
      <p className="mt-1 text-xs text-dim">{label}</p>
    </div>
  );
}
