'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useFollowing } from '@/lib/useFollows';
import AuthPromptModal from './AuthPromptModal';

export default function FollowButton({ targetUserId }: { targetUserId: string }) {
  const { user } = useAuth();
  const { followingIds, toggleFollow } = useFollowing(user?.id);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);

  if (user && user.id === targetUserId) return null;
  const isFollowing = followingIds.has(targetUserId);

  function handleClick() {
    if (!user) {
      setAuthPromptOpen(true);
      return;
    }
    toggleFollow(targetUserId);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 border-bg text-[10px] font-bold text-ink ${
          isFollowing ? 'bg-green' : 'bg-red'
        }`}
        aria-label={isFollowing ? 'Suivi' : 'Suivre'}
      >
        {isFollowing ? '✓' : '+'}
      </button>
      {authPromptOpen && (
        <AuthPromptModal action="suivre cette personne" onClose={() => setAuthPromptOpen(false)} />
      )}
    </>
  );
}
