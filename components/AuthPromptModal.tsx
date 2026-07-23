'use client';

import Link from 'next/link';

export default function AuthPromptModal({
  action,
  onClose
}: {
  action: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 md:items-center" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-t-3xl border-t border-line bg-surface p-6 text-center md:rounded-3xl md:border"
        onClick={e => e.stopPropagation()}
      >
        <span className="text-3xl">🔒</span>
        <h3 className="mt-3 font-display text-lg font-bold text-ink">Connecte-toi pour continuer</h3>
        <p className="mt-2 text-sm text-dim">
          Crée un compte ou connecte-toi pour {action} — c&apos;est gratuit et ça prend une minute.
        </p>

        <Link
          href="/signup"
          className="mt-6 block w-full rounded-full bg-red py-3 font-display text-sm font-bold text-ink transition hover:bg-red-light"
        >
          Créer un compte
        </Link>
        <Link
          href="/login"
          className="mt-3 block w-full rounded-full border border-line py-3 font-display text-sm font-bold text-ink transition hover:border-red"
        >
          Se connecter
        </Link>
        <button onClick={onClose} className="mt-4 font-display text-xs font-semibold text-dim hover:text-ink">
          Continuer à parcourir
        </button>
      </div>
    </div>
  );
}