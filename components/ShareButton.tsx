'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/useAuth';

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 >= 100 ? 1 : 0)}K`;
  return String(n);
}

export default function ShareButton({
  title,
  url,
  reportId,
  count,
  compact
}: {
  title: string;
  url: string;
  reportId?: string;
  count?: number;
  compact?: boolean;
}) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [localCount, setLocalCount] = useState(count ?? 0);

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // partage annulé par l'utilisateur : rien à faire, on ne compte pas ça comme un partage
        return;
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }

    if (reportId && user) {
      setLocalCount(v => v + 1);
      await supabase.from('report_shares').insert({ report_id: reportId, user_id: user.id });
    }
  }

  if (compact) {
    return (
      <button type="button" onClick={share} className="flex flex-col items-center gap-1 text-ink" aria-label="Partager">
        <span className="text-2xl">↗️</span>
        <span className="font-display text-xs font-bold drop-shadow">{formatCount(localCount)}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={share}
      className="rounded-lg border border-line px-3 py-2 font-display text-xs font-bold text-dim transition hover:border-red hover:text-red"
    >
      {copied ? 'Lien copié ✓' : '↗ Partager'}
    </button>
  );
}
