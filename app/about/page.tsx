'use client';

import { useRouter } from 'next/navigation';
import Logo, { Wordmark } from '@/components/Logo';

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-sm px-5 py-10">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} aria-label="Retour" className="text-dim hover:text-ink">←</button>
        <h1 className="font-display text-lg font-bold text-ink">À propos</h1>
      </div>

      <div className="mt-10 flex flex-col items-center text-center">
        <Logo size={56} />
        <div className="mt-4">
          <Wordmark className="text-2xl" />
        </div>
        <p className="mt-2 font-display text-xs font-semibold text-dim">Informer. Alerter. Agir.</p>
      </div>

      <p className="mt-6 text-center text-sm text-dim">
        Mboa Live permet aux Camerounais de signaler les problèmes dans leur ville en vidéos ou
        en photos, de suivre les signalements en temps réel et d&apos;agir ensemble pour le
        changement.
      </p>

      <div className="mt-8 space-y-3 rounded-2xl border border-line bg-surface p-5 text-sm text-dim">
        <div className="flex justify-between">
          <span>Version</span>
          <span className="text-ink">1.0.0</span>
        </div>
        <div className="flex justify-between">
          <span>Villes couvertes</span>
          <span className="text-ink">Douala, Yaoundé</span>
        </div>
      </div>
    </div>
  );
}
