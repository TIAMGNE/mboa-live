'use client';

import { useAuth } from '@/lib/useAuth';
import { useFavoriteReports } from '@/lib/useFavorites';
import ReportCard from '@/components/ReportCard';

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const { reports, loading } = useFavoriteReports(user?.id);

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
    <div className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Mes favoris</h1>
      <p className="mt-1 text-sm text-dim">Les signalements que tu as mis de côté.</p>

      {loading && <p className="mt-6 text-sm text-dim">Chargement...</p>}

      {!loading && reports.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-line p-10 text-center">
          <p className="font-display text-lg font-bold text-ink">Aucun favori pour l&apos;instant</p>
          <p className="mt-2 text-sm text-dim">
            Appuie sur l&apos;étoile ☆ d&apos;un signalement dans le feed pour le retrouver ici.
          </p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map(report => (
          <ReportCard key={report.id} report={report} />
        ))}
      </div>
    </div>
  );
}
