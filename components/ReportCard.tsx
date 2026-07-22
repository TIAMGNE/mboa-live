import Link from 'next/link';
import { Report } from '@/lib/types';
import { timeAgo } from '@/lib/reportUtils';
import { statusLabel, statusClasses } from '@/lib/statusLabel';
import CategoryBadge from './CategoryBadge';
import MediaThumbnail from './MediaThumbnail';

export default function ReportCard({ report }: { report: Report }) {
  const cityLabel = report.city_id === 'douala' ? 'Douala' : 'Yaoundé';

  return (
    <Link
      href={`/feed?report=${report.id}`}
      className="group block overflow-hidden rounded-2xl border border-line bg-surface transition hover:border-red/60"
    >
      {report.media_urls?.[0] && (
        <MediaThumbnail
          url={report.media_urls[0]}
          mediaType={report.media_type}
          alt={report.title}
          className="h-40 w-full object-cover"
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
          <span className="flex items-center gap-3 font-mono text-[11px] text-dim">
            <span className="inline-flex items-center gap-1">♡ {report.confirmations_up}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
