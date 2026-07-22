'use client';

import { formatCount } from '@/lib/useLike';

/** Composant d'affichage pur : l'état (aimé ou non, compteur) est géré par
 * useLike() dans le composant parent, pour pouvoir être partagé avec le
 * double-tap sur la vidéo (même signalement = même état de like). */
export default function LikeButton({
  liked,
  count,
  onLike,
  canLike
}: {
  liked: boolean;
  count: number;
  onLike: () => void;
  canLike: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onLike}
      disabled={!canLike}
      className="flex flex-col items-center gap-1 text-ink disabled:opacity-60"
      aria-label="J'aime"
    >
      <span className={`text-2xl transition ${liked ? 'scale-110' : ''}`}>
        {liked ? '❤️' : '🤍'}
      </span>
      <span className="font-display text-xs font-bold drop-shadow">{formatCount(count)}</span>
    </button>
  );
}
