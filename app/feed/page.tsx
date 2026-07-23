'use client';

import { Suspense } from 'react';
import VerticalFeed from '@/components/VerticalFeed';

export default function FeedPage() {
  return (
    <Suspense fallback={<div className="flex h-[calc(100vh-52px)] items-center justify-center text-sm text-dim">Chargement...</div>}>
      <VerticalFeed />
    </Suspense>
  );
}
