'use client';

import { useState } from 'react';

export default function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // partage annulé par l'utilisateur : rien à faire
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={share}
      className="rounded-lg border border-line px-3 py-2 font-display text-xs font-bold text-dim transition hover:border-gold hover:text-gold"
    >
      {copied ? 'Lien copié ✓' : '↗ Partager'}
    </button>
  );
}
