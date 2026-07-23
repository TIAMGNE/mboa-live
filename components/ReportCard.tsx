import Link from 'next/link';
import { Report } from '@/lib/types';
import { timeAgo } from '@/lib/reportUtils';
import { statusLabel, statusClasses } from '@/lib/statusLabel';
import CategoryBadge from './CategoryBadge';
import MediaThumbnail from './MediaThumbnail';

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 >= 100 ? 1 : 0)}K`;
  return String(n);
}

export default function ReportCard({ report }: { report: Report }) {
  const cityLabel = report.city_id === 'douala' ? 'Douala' : 'Yaoundé';
  const authorName = report.author?.full_name || 'Utilisateur MBOA';
  const authorHandle = report.author?.username ? `@${report.author.username}` : null;

  return (
    <div className="group animate-fadeInUp overflow-hidden rounded-2xl border border-line bg-surface transition hover:border-red/60 hover:-translate-y-0.5">
      {/* En-tête auteur */}
      {report.user_id && (
        <Link
          href={`/profile/${report.user_id}`}
          onClick={e => e.stopPropagation()}
          className="flex items-center gap-2 px-4 pt-3 hover:opacity-80"
        >
          <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-surface2 font-display text-[11px] font-bold text-ink">
            {report.author?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={report.author.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              authorName.charAt(0).toUpperCase()
            )}
          </span>
          <span className="text-xs font-semibold text-ink">{authorHandle || authorName}</span>
          {report.is_emergency && (
            <span className="ml-auto rounded-full bg-red px-2 py-0.5 font-display text-[9px] font-bold text-ink">🚨</span>
          )}
        </Link>
      )}

      <Link href={`/feed?report=${report.id}`} className="block">
        {report.media_urls?.[0] && (
          <MediaThumbnail
            url={report.media_urls[0]}
            mediaType={report.media_type}
            alt={report.title}
            className="mt-2 h-40 w-full object-cover"
          />
        )}
        <div className="space-y-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <CategoryBadge categoryId={report.category_id} />
            <span
              className={`rounded-full border px-2 py-0.5 font-display text-[10px] font-bold ${statusClasses(report.status)}`}
            >
              {statusLabel(report.status)}
            </span>
          </div>
          <h3 className="font-display text-base font-bold leading-snug text-ink group-hover:text-red">
            {report.title}
          </h3>
          {report.description && (
            <p className="line-clamp-2 text-sm text-dim">{report.description}</p>
          )}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-dim">{cityLabel} · {timeAgo(report.created_at)}</span>
            <span className="flex items-center gap-2.5 font-mono text-[11px] text-dim">
              {report.confirmations_up > 0 && <span className="inline-flex items-center gap-1">❤️ {formatCount(report.confirmations_up)}</span>}
              {report.comments_count > 0 && <span className="inline-flex items-center gap-1">💬 {formatCount(report.comments_count)}</span>}
              {report.views_count > 0 && <span className="inline-flex items-center gap-1">👁 {formatCount(report.views_count)}</span>}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
