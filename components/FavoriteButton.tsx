'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useFavoriteIds } from '@/lib/useFavorites';
import AuthPromptModal from './AuthPromptModal';

export default function FavoriteButton({ reportId, compact }: { reportId: string; compact?: boolean }) {
  const { user } = useAuth();
  const { favoriteIds, toggleFavorite } = useFavoriteIds(user?.id);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const isFav = favoriteIds.has(reportId);

  function handleClick() {
    if (!user) {
      setAuthPromptOpen(true);
      return;
    }
    toggleFavorite(reportId);
  }

  if (compact) {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          className="flex flex-col items-center gap-1 text-ink"
          aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <span className="text-2xl">{isFav ? '⭐' : '☆'}</span>
        </button>
        {authPromptOpen && (
          <AuthPromptModal action="enregistrer ce signalement dans tes favoris" onClose={() => setAuthPromptOpen(false)} />
        )}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`rounded-lg border px-3 py-2 font-display text-xs font-bold transition ${
          isFav ? 'border-amber/40 bg-amber/10 text-amber' : 'border-line text-dim hover:border-amber hover:text-amber'
        }`}
        aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      >
        {isFav ? '⭐ Dans tes favoris' : '☆ Ajouter aux favoris'}
      </button>
      {authPromptOpen && (
        <AuthPromptModal action="enregistrer ce signalement dans tes favoris" onClose={() => setAuthPromptOpen(false)} />
      )}
    </>
  );
}
