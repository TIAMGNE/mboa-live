'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { useReports } from '@/lib/useReports';
import { useFollowing } from '@/lib/useFollows';
import { useLike, formatCount } from '@/lib/useLike';
import { supabase } from '@/lib/supabaseClient';
import { getCategory } from '@/lib/categories';
import { timeAgo } from '@/lib/reportUtils';
import { statusLabel, statusClasses } from '@/lib/statusLabel';
import LikeButton from '@/components/LikeButton';
import FollowButton from '@/components/FollowButton';
import FavoriteButton from '@/components/FavoriteButton';
import CommentsSheet from '@/components/CommentsSheet';
import ShareSheet from '@/components/ShareSheet';
import ReportFlagSheet from '@/components/ReportFlagSheet';
import AuthPromptModal from '@/components/AuthPromptModal';
import VideoPlayer from '@/components/VideoPlayer';
import { Report } from '@/lib/types';

function looksLikeVideo(url: string) {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);
}

export default function VerticalFeed() {
  const { user, profile } = useAuth();
  const { reports, loading, error } = useReports();
  const { followingIds } = useFollowing(user?.id);
  const params = useSearchParams();
  const router = useRouter();
  const [tab, setTab] = useState<'pour-toi' | 'tendance' | 'national' | 'abonnements' | 'urgences'>('pour-toi');
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const q = params.get('q');
    if (q) setSearch(q);
  }, [params]);

  const visible = useMemo(() => {
    let list = reports;

    if (tab === 'pour-toi' && profile?.city) {
      list = list.filter(r => r.city_id === profile.city);
    } else if (tab === 'abonnements') {
      list = list.filter(r => r.user_id && followingIds.has(r.user_id));
    } else if (tab === 'urgences') {
      list = list.filter(r => r.is_emergency);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        r => r.title.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)
      );
    }

    if (tab === 'tendance') {
      list = [...list].sort(
        (a, b) => b.confirmations_up + b.views_count * 0.1 - (a.confirmations_up + a.views_count * 0.1)
      );
    }

    return list;
  }, [reports, tab, followingIds, search, profile?.city]);

  useEffect(() => {
    const targetId = params.get('report');
    if (!targetId || !containerRef.current) return;
    const el = containerRef.current.querySelector<HTMLElement>(`[data-report-id="${targetId}"]`);
    el?.scrollIntoView({ block: 'start' });
  }, [params, visible.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      entries => {
        const mostVisible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (mostVisible) {
          const id = (mostVisible.target as HTMLElement).dataset.reportId;
          if (id) setActiveId(id);
        }
      },
      { root: container, threshold: [0.6, 0.9] }
    );

    const slides = container.querySelectorAll('[data-report-id]');
    slides.forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, [visible.length]);

  useEffect(() => {
    if (!activeId || !user || viewedRef.current.has(activeId)) return;
    viewedRef.current.add(activeId);
    supabase.from('report_views').insert({ report_id: activeId, user_id: user.id }).then();
  }, [activeId, user]);

  const activeIndex = visible.findIndex(r => r.id === activeId);

  const TABS: { id: typeof tab; label: string }[] = [
    { id: 'pour-toi', label: 'Pour toi' },
    { id: 'tendance', label: 'Tendance' },
    { id: 'national', label: 'National' },
    { id: 'abonnements', label: 'Abonnements' },
    { id: 'urgences', label: '🚨' }
  ];

  return (
    <div className="relative h-[calc(100vh-64px)] bg-black md:h-[calc(100vh-65px)]">
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-center gap-4 overflow-x-auto bg-gradient-to-b from-black/70 to-transparent px-5 pb-6 pt-4">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 font-display text-sm font-bold ${tab === t.id ? 'text-ink' : 'text-ink/50'}`}
          >
            {t.label}
            {tab === t.id && <span className="mt-1 block h-0.5 w-full bg-red" />}
          </button>
        ))}
        <button
          onClick={() => setSearchOpen(v => !v)}
          className="absolute right-5 text-ink"
          aria-label="Rechercher"
        >
          🔍
        </button>
      </div>

      {searchOpen && (
        <div className="absolute inset-x-0 top-14 z-20 px-5">
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un signalement..."
            className="w-full rounded-full border border-line bg-surface/90 px-4 py-2.5 text-sm text-ink outline-none backdrop-blur focus:border-red"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                router.replace('/feed');
              }}
              className="mt-2 font-display text-xs font-semibold text-dim"
            >
              ✕ Effacer la recherche
            </button>
          )}
        </div>
      )}

      {loading && (
        <div className="flex h-full items-center justify-center text-sm text-dim">Chargement...</div>
      )}

      {!loading && error && (
        <div className="flex h-full flex-col items-center justify-center px-8 text-center">
          <p className="font-display text-lg font-bold text-ink">Impossible de charger les signalements</p>
          <p className="mt-2 max-w-sm text-sm text-dim">{error}</p>
        </div>
      )}

      {!loading && !error && visible.length === 0 && (
        <div className="flex h-full flex-col items-center justify-center px-8 text-center">
          <p className="font-display text-lg font-bold text-ink">
            {tab === 'abonnements' ? "Personne à suivre pour l'instant" : 'Rien pour l\'instant'}
          </p>
          <p className="mt-2 text-sm text-dim">
            {tab === 'abonnements'
              ? "Suis d'autres personnes depuis l'onglet Pour toi pour voir leurs signalements ici."
              : 'Sois le premier à publier un signalement.'}
          </p>
        </div>
      )}

      <div ref={containerRef} className="h-full snap-y snap-mandatory overflow-y-scroll scroll-smooth">
        {visible.map((report, i) => (
          <FeedSlide
            key={report.id}
            report={report}
            active={report.id === activeId}
            nearby={Math.abs(i - activeIndex) <= 1}
            onOpenComments={() => setCommentsFor(report.id)}
          />
        ))}
      </div>