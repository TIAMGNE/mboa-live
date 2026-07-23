'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useFollowing } from '@/lib/useFollows';
import AuthPromptModal from './AuthPromptModal';

export default function FollowButton({ targetUserId }: { targetUserId: string }) {
  const { user } = useAuth();
  const { followingIds, toggleFollow } = useFollowing(user?.id);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  if (user && user.id === targetUserId) return null;
  const isFollowing = followingIds.has(targetUserId);

  async function handleClick() {
    if (!user) {
      setAuthPromptOpen(true);
      return;
    }
    if (busy) return;
    setBusy(true);
    setFailed(false);
    const ok = await toggleFollow(targetUserId);
    setBusy(false);
    if (!ok) {
      setFailed(true);
      setTimeout(() => setFailed(false), 2500);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 border-bg text-[10px] font-bold text-ink disabled:opacity-60 ${
          isFollowing ? 'bg-green' : 'bg-red'
        }`}
        aria-label={isFollowing ? 'Suivi' : 'Suivre'}
      >
        {isFollowing ? '✓' : '+'}
      </button>
      {failed && (
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/80 px-2 py-1 text-[10px] font-semibold text-ink">
          Échec, réessaie
        </span>
      )}
      {authPromptOpen && (
        <AuthPromptModal action="suivre cette personne" onClose={() => setAuthPromptOpen(false)} />
      )}
    </div>
  );
}
