'use client';

import Link from 'next/link';
import { useReports } from '@/lib/useReports';
import LiveTicker from '@/components/LiveTicker';
import ReportCard from '@/components/ReportCard';

export default function HomePage() {
  const { reports, loading } = useReports();
  const recent = reports.slice(0, 6);

  return (
    <div>
      <LiveTicker reports={reports} />

      {/* ---------- Hero ---------- */}
      <section className="mx-auto max-w-6xl px-5 pb-10 pt-14 md:pt-20">
        <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-gold">
          Douala · Yaoundé
        </p>
        <h1 className="mt-4 max-w-2xl font-display text-4xl font-bold leading-[1.05] text-ink md:text-6xl">
          Qu&apos;est-ce qui se passe autour de toi{' '}
          <span className="text-gold">en ce moment&nbsp;?</span>
        </h1>
        <p className="mt-5 max-w-xl text-base text-dim md:text-lg">
          MBOA LIVE — le Cameroun en temps réel. Embouteillages, événements, coupures,
          promos : vu et confirmé par des gens comme toi, à l&apos;instant.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/map"
            className="rounded-full bg-gold px-6 py-3 font-display text-sm font-bold text-bg transition hover:bg-gold-light"
          >
            Voir la carte live
          </Link>
          <Link
            href="/report"
            className="rounded-full border border-line px-6 py-3 font-display text-sm font-bold text-ink transition hover:border-gold hover:text-gold"
          >
            + Signaler quelque chose
          </Link>
        </div>
      </section>

      {/* ---------- Récent ---------- */}
      <section className="mx-auto max-w-6xl px-5 pb-24">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-ink">À l&apos;instant</h2>
          <Link href="/feed" className="font-display text-xs font-semibold text-gold">
            Tout voir →
          </Link>
        </div>

        {loading && <p className="text-sm text-dim">Chargement des signalements...</p>}

        {!loading && recent.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line p-10 text-center">
            <p className="font-display text-lg font-bold text-ink">Rien pour l&apos;instant</p>
            <p className="mt-2 text-sm text-dim">
              Sois le premier à signaler ce qui se passe près de toi.
            </p>
            <Link
              href="/report"
              className="mt-4 inline-block rounded-full bg-gold px-5 py-2.5 font-display text-sm font-bold text-bg"
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
