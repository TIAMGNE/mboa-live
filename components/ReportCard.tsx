import Link from 'next/link';
import { Report } from '@/lib/types';
import { timeAgo, reliability } from '@/lib/reportUtils';
import CategoryBadge from './CategoryBadge';

export default function ReportCard({ report }: { report: Report }) {
  const score = reliability(report);
  const cityLabel = report.city_id === 'douala' ? 'Douala' : 'Yaoundé';

  return (
    <Link
      href={`/feed?report=${report.id}`}
      className="group block overflow-hidden rounded-2xl border border-line bg-surface transition hover:border-gold/60"
    >
      {report.media_urls?.[0] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={report.media_urls[0]}
          alt={report.title}
          className="h-40 w-full object-cover"
        />
      )}
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <CategoryBadge categoryId={report.category_id} />
          <span className="font-mono text-[11px] text-dim">{timeAgo(report.created_at)}</span>
        </div>
        <h3 className="font-display text-base font-bold leading-snug text-ink group-hover:text-gold">
          {report.title}
        </h3>
        {report.description && (
          <p className="line-clamp-2 text-sm text-dim">{report.description}</p>
        )}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-dim">{cityLabel}</span>
          <span
            className="font-mono text-[11px] font-semibold"
            style={{ color: score > 60 ? '#4CC490' : score > 30 ? '#F4C862' : '#F16A62' }}
          >
            Fiabilité {score}%
          </span>
        </div>
      </div>
    </Link>
  );
}
