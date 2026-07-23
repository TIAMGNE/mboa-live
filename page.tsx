'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { useReports } from '@/lib/useReports';
import { CATEGORIES, CITIES } from '@/lib/categories';
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

type FilterId = 'pour-toi' | 'recent' | 'urgences' | CategoryFilter | CityFilter;
type CategoryFilter = `cat:${string}`;
type CityFilter = `city:${string}`;

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const { reports, loading, error } = useReports();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterId>('pour-toi');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = reports;
    if (filter === 'urgences') list = list.filter(r => r.is_emergency);
    else if (filter.startsWith('cat:')) list = list.filter(r => r.category_id === filter.slice(4));
    else if (filter.startsWith('city:')) list = list.filter(r => r.city_id === filter.slice(5));
    // "pour-toi" et "recent" gardent tout, déjà trié par date récente (voir useReports).
    return list.slice(0, 12);
  }, [reports, filter]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) router.push(`/search?q=${encodeURIComponent(search.trim())}`);
  }

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

  const FILTERS: { id: FilterId; label: string }[] = [
    { id: 'pour-toi', label: 'Pour toi' },
    { id: 'recent', label: 'Récent' },
    { id: 'urgences', label: '🚨 Urgences' },
    ...CITIES.map(c => ({ id: `city:${c.id}` as FilterId, label: c.name })),
    ...CATEGORIES.map(c => ({ id: `cat:${c.id}` as FilterId, label: `${c.icon} ${c.label}` }))
  ];

  return (
    <div>
      {/* Bandeau compact — plus de gros hero qui repousse le contenu */}
      <div className="mx-auto max-w-6xl px-5 pt-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-lg font-bold text-ink">
            Ce qui se passe <span className="text-red">près de toi</span>
          </h1>
          <Link href="/report" className="rounded-full bg-red px-4 py-2 font-display text-xs font-bold text-ink transition hover:bg-red-light">
            + Signaler
          </Link>
        </div>

        {/* Recherche */}
        <form onSubmit={submitSearch} className="mt-4">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-dim">🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une ville, un sujet, une personne..."
              className="w-full rounded-full border border-line bg-surface py-3 pl-11 pr-4 text-sm text-ink outline-none focus:border-red"
            />
          </div>
        </form>

        {/* Filtres horizontaux */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 font-display text-xs font-semibold transition ${
                filter === f.id ? 'border-red bg-red/15 text-red' : 'border-line text-dim hover:text-ink'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <LiveTicker reports={reports} />

      {/* Le contenu apparaît tout de suite, pas après un gros bloc marketing */}
      <section className="mx-auto max-w-6xl px-5 pb-24 pt-6">
        {loading && <p className="text-sm text-dim">Chargement des signalements...</p>}

        {!loading && error && (
          <p className="rounded-lg border border-red/40 bg-red/10 px-4 py-3 text-sm text-red-light">
            Impossible de charger les signalements : {error}
          </p>
        )}

        {!loading && !error && filtered.length === 0 && (
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
          {filtered.map(report => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>

        {filtered.length > 0 && (
          <div className="mt-8 text-center">
            <Link href="/feed" className="font-display text-sm font-bold text-red hover:underline">
              Voir tout dans le feed →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
