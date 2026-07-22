'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/useAuth';

interface ShareSheetProps {
  title: string;
  url: string;
  reportId: string;
  onClose: () => void;
  onShared: () => void;
}

export default function ShareSheet({ title, url, reportId, onClose, onShared }: ShareSheetProps) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  async function logShare() {
    if (!user) return;
    onShared();
    await supabase.from('report_shares').insert({ report_id: reportId, user_id: user.id });
  }

  async function shareTo(target: 'whatsapp' | 'facebook' | 'messenger') {
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(title);
    const links: Record<typeof target, string> = {
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      messenger: `https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=&redirect_uri=${encodedUrl}`
    };
    window.open(links[target], '_blank', 'noopener,noreferrer');
    await logShare();
  }

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    await logShare();
    setTimeout(() => setCopied(false), 2000);
  }

  async function nativeShare() {
    if (!navigator.share) return;
    try {
      await navigator.share({ title, url });
      await logShare();
    } catch {
      // partage annulé par l'utilisateur : rien à faire
    }
  }

  const OPTIONS = [
    { key: 'whatsapp', label: 'WhatsApp', icon: '💬', action: () => shareTo('whatsapp') },
    { key: 'facebook', label: 'Facebook', icon: '📘', action: () => shareTo('facebook') },
    { key: 'messenger', label: 'Messenger', icon: '✉️', action: () => shareTo('messenger') },
    { key: 'copy', label: copied ? 'Lien copié ✓' : 'Copier le lien', icon: '🔗', action: copyLink }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-3xl border-t border-line bg-surface p-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-sm font-bold text-ink">Partager</h3>
          <button onClick={onClose} aria-label="Fermer" className="text-dim hover:text-ink">✕</button>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {OPTIONS.map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={opt.action}
              className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface2 py-4 text-center"
            >
              <span className="text-2xl">{opt.icon}</span>
              <span className="px-1 text-[11px] font-semibold text-ink">{opt.label}</span>
            </button>
          ))}
        </div>

        {typeof navigator !== 'undefined' && !!navigator.share && (
          <button
            type="button"
            onClick={nativeShare}
            className="mt-4 w-full rounded-full border border-line py-3 font-display text-xs font-bold text-dim transition hover:border-red hover:text-red"
          >
            ↗ Plus d&apos;options de partage
          </button>
        )}
      </div>
    </div>
  );
}
