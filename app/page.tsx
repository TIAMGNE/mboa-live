'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import { useReports } from '@/lib/useReports';
import LiveTicker from '@/components/LiveTicker';
import ReportCard from '@/components/ReportCard';
import Logo, { Wordmark } from '@/components/Logo';

const PILLARS = [
  { icon: '📷', title: 'Publiez', text: 'Une vidéo ou une photo' },
  { icon: '⚠️', title: 'Signalez', text: 'Un problème' },
  { icon: '📍', title: 'Localisez', text: 'Le problème' },
  { icon: '📈', title: 'Suivez', text: "L'évolution" },
  { icon: '👥', title: 'Agissez', text: 'Pour le changement' }
];

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const { reports, loading, error } = useReports();
  const recent = reports.slice(0, 6);

  if (!authLoading && !user) {
    return (
      <div className="relative min-h-[calc(100vh-64px)] overflow-hidden">
        {/* Vidéo de fond — dépose ton fichier dans public/videos/hero.mp4 (voir note plus bas) */}
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/videos/hero.mp4"
          poster="/videos/hero-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="absolute inset-0 bg-gradient-to-b from-bg/80 via-bg/70 to-bg" />

        <div className="relative mx-auto max-w-md px-5 py-16 text-center">
          <div className="flex justify-center">
            <Logo size={64} />
          </div>
          <div className="mt-5 flex justify-center">
            <Wordmark className="text-3xl" />
          </div>
          <p className="mt-2 font-display text-sm font-semibold text-dim">Informer. Alerter. Agir.</p>

          <p className="mx-auto mt-6 max-w-xs text-sm text-dim">
            Mboa Live permet aux Camerounais de signaler les problèmes dans leur ville en vidéos
            ou en photos, de suivre les signalements en temps réel et d&apos;agir ensemble pour le
            changement.
          </p>

          <div className="mt-8 space-y-2 text-left">
            {PILLARS.map(p => (
              <div key={p.title} className="flex items-center gap-3 rounded-2xl border border-line bg-surface/90 px-4 py-3 backdrop-blur">
                <span className="text-xl">{p.icon}</span>
                <p className="text-sm text-ink">
                  <span className="font-display font-bold">{p.title}</span> {p.text.toLowerCase()}
                </p>
              </div>
            ))}
          </div>

          <Link
            href="/signup"
            className="mt-8 block w-full rounded-full bg-red py-3.5 font-display text-sm font-bold text-ink transition hover:bg-red-light"
          >
            Commencer
          </Link>
          <Link href="/login" className="mt-4 block font-display text-sm font-semibold text-dim hover:text-ink">
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <LiveTicker reports={reports} />

      <section className="mx-auto max-w-6xl px-5 pb-6 pt-10">
        <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-red">
          Douala · Yaoundé
        </p>
        <h1 className="mt-3 max-w-2xl font-display text-3xl font-bold leading-[1.1] text-ink md:text-5xl">
          Qu&apos;est-ce qui se passe autour de toi{' '}
          <span className="text-red">en ce moment&nbsp;?</span>
        </h1>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/feed"
            className="rounded-full bg-red px-6 py-3 font-display text-sm font-bold text-ink transition hover:bg-red-light"
          >
            Voir les signalements
          </Link>
          <Link
            href="/report"
            className="rounded-full border border-line px-6 py-3 font-display text-sm font-bold text-ink transition hover:border-red hover:text-red"
          >
            + Signaler quelque chose
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-ink">À l&apos;instant</h2>
          <Link href="/feed" className="font-display text-xs font-semibold text-red">
            Tout voir →
          </Link>
        </div>

        {loading && <p className="text-sm text-dim">Chargement des signalements...</p>}

        {!loading && error && (
          <p className="rounded-lg border border-red/40 bg-red/10 px-4 py-3 text-sm text-red-light">
            Impossible de charger les signalements : {error}
          </p>
        )}

        {!loading && !error && recent.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line p-10 text-center">
            <p className="font-display text-lg font-bold text-ink">Rien pour l&apos;instant</p>
            <p className="mt-2 text-sm text-dim">
              Sois le premier à signaler ce qui se passe près de toi.
            </p>
            <Link
              href="/report"
              className="mt-4 inline-block rounded-full bg-red px-5 py-2.5 font-display text-sm font-bold text-ink"
            >
              + Faire un signalement
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recent.map(report => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      </section>
    </div>
  );
}
