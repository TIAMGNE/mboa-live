'use client';

import { useAuth } from '@/lib/useAuth';
import { useFollowing } from '@/lib/useFollows';

export default function FollowButton({ targetUserId }: { targetUserId: string }) {
  const { user } = useAuth();
  const { followingIds, toggleFollow } = useFollowing(user?.id);

  if (!user || user.id === targetUserId) return null;
  const isFollowing = followingIds.has(targetUserId);

  return (
    <button
      type="button"
      onClick={() => toggleFollow(targetUserId)}
      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 border-bg text-[10px] font-bold text-ink ${
        isFollowing ? 'bg-green' : 'bg-red'
      }`}
      aria-label={isFollowing ? "Suivi" : "Suivre"}
    >
      {isFollowing ? '✓' : '+'}
    </button>
  );
}
