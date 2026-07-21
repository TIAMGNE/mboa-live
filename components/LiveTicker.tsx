'use client';

import { Report } from '@/lib/types';
import { getCategory } from '@/lib/categories';

export default function LiveTicker({ reports }: { reports: Report[] }) {
  if (!reports.length) return null;
  const items = [...reports, ...reports]; // boucle continue

  return (
    <div className="overflow-hidden border-y border-line bg-surface">
      <div className="flex items-center gap-2 border-r border-line bg-red/10 px-4 py-2 shrink-0 absolute z-10">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-pulseRing rounded-full bg-red" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red" />
        </span>
        <span className="font-display text-xs font-bold text-red">EN DIRECT</span>
      </div>
      <div className="flex animate-ticker whitespace-nowrap py-2 pl-32">
        {items.map((r, i) => (
          <span key={`${r.id}-${i}`} className="mx-6 inline-flex items-center gap-2 text-sm text-dim">
            <span>{getCategory(r.category_id).icon}</span>
            <span className="font-medium text-ink">{r.title}</span>
            <span className="text-xs">· {r.city_id === 'douala' ? 'Douala' : 'Yaoundé'}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
