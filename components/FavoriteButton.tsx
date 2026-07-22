'use client';

import { useAuth } from '@/lib/useAuth';
import { useFavoriteIds } from '@/lib/useFavorites';

export default function FavoriteButton({ reportId, compact }: { reportId: string; compact?: boolean }) {
  const { user } = useAuth();
  const { favoriteIds, toggleFavorite } = useFavoriteIds(user?.id);

  if (!user) return null;
  const isFav = favoriteIds.has(reportId);

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => toggleFavorite(reportId)}
        className="flex flex-col items-center gap-1 text-ink"
        aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      >
        <span className="text-2xl">{isFav ? '⭐' : '☆'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggleFavorite(reportId)}
      className={`rounded-lg border px-3 py-2 font-display text-xs font-bold transition ${
        isFav ? 'border-amber/40 bg-amber/10 text-amber' : 'border-line text-dim hover:border-amber hover:text-amber'
      }`}
      aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      {isFav ? '⭐ Dans tes favoris' : '☆ Ajouter aux favoris'}
    </button>
  );
}
