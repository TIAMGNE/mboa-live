'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useReports } from '@/lib/useReports';
import ReportCard from '@/components/ReportCard';
import CategoryBadge from '@/components/CategoryBadge';
import ConfirmButtons from '@/components/ConfirmButtons';
import Comments from '@/components/Comments';
import ShareButton from '@/components/ShareButton';
import { timeAgo } from '@/lib/reportUtils';

export default function FeedPage() {
  const { reports, loading } = useReports();
  const params = useSearchParams();
  const router = useRouter();
  const activeId = params.get('report');
  const active = reports.find(r => r.id === activeId);

  if (active) {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    return (
      <div className="mx-auto max-w-2xl px-5 py-8">
        <button
          onClick={() => router.push('/feed')}
          className="mb-6 font-display text-xs font-semibold text-dim hover:text-ink"
        >
          ← Retour au flux
        </button>

        {active.media_urls?.[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={active.media_urls[0]} alt={active.title} className="mb-5 w-full rounded-2xl object-cover" style={{ maxHeight: 360 }} />
        )}

        <div className="mb-3 flex items-center justify-between">
          <CategoryBadge categoryId={active.category_id} />
          <span className="font-mono text-xs text-dim">{timeAgo(active.created_at)}</span>
        </div>

        <h1 className="font-display text-2xl font-bold text-ink">{active.title}</h1>
        {active.description && <p className="mt-3 text-sm text-dim">{active.description}</p>}
        <p className="mt-2 text-xs text-dim">{active.city_id === 'douala' ? 'Douala' : 'Yaoundé'}</p>

        <div className="mt-5 flex gap-2">
          <ShareButton title={active.title} url={url} />
        </div>

        <div className="mt-6">
          <ConfirmButtons
            reportId={active.id}
            confirmationsUp={active.confirmations_up}
            confirmationsDown={active.confirmations_down}
          />
        </div>

        <div className="mt-8">
          <Comments reportId={active.id} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Tendances</h1>
      <p className="mt-1 text-sm text-dim">Tout ce qui se passe en ce moment, du plus récent au plus ancien.</p>

      {loading && <p className="mt-6 text-sm text-dim">Chargement...</p>}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map(report => (
          <ReportCard key={report.id} report={report} />
        ))}
      </div>
    </div>
  );
}
