'use client';

import { useRouter } from 'next/navigation';

const OPTIONS = [
  { icon: '📷', label: 'Prendre une photo', href: '/report?media=photo&camera=1' },
  { icon: '🎥', label: 'Filmer une vidéo', href: '/report?media=video&camera=1' },
  { icon: '🖼️', label: 'Importer une photo', href: '/report?media=photo' },
  { icon: '📹', label: 'Importer une vidéo', href: '/report?media=video' },
  { icon: '🚨', label: 'Signaler une urgence', href: '/report?emergency=1' }
];

const SOON = [
  { icon: '🎉', label: 'Créer un événement' },
  { icon: '🏷️', label: 'Créer une promotion' },
  { icon: '📢', label: 'Créer une annonce' }
];

export default function CreateSheet({ onClose }: { onClose: () => void }) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-3xl border-t border-line bg-surface p-5 pb-8"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-sm font-bold text-ink">Que veux-tu faire ?</h3>
          <button onClick={onClose} aria-label="Fermer" className="text-dim hover:text-ink">✕</button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {OPTIONS.map(opt => (
            <button
              key={opt.label}
              onClick={() => {
                onClose();
                router.push(opt.href);
              }}
              className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface2 py-4 text-center"
            >
              <span className="text-2xl">{opt.icon}</span>
              <span className="px-1 text-[11px] font-semibold text-ink">{opt.label}</span>
            </button>
          ))}
          {SOON.map(opt => (
            <div
              key={opt.label}
              className="flex cursor-not-allowed flex-col items-center gap-2 rounded-2xl border border-line bg-surface2 py-4 text-center opacity-40"
            >
              <span className="text-2xl">{opt.icon}</span>
              <span className="px-1 text-[11px] font-semibold text-ink">{opt.label}</span>
              <span className="font-display text-[9px] font-bold text-dim">Bientôt</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
