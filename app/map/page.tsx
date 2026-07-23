'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useReports } from '@/lib/useReports';
import { CITIES } from '@/lib/categories';
import { CityId } from '@/lib/types';

// Leaflet a besoin du navigateur (window/document) : on désactive le rendu serveur.
const LiveMap = dynamic(() => import('@/components/LiveMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-dim">
      Chargement de la carte...
    </div>
  )
});

export default function MapPage() {
  const [city, setCity] = useState<CityId>('douala');
  const { reports } = useReports(city);
  const center = CITIES.find(c => c.id === city)!;

  return (
    <div className="flex h-[calc(100vh-52px)] flex-col">
      <div className="flex items-center gap-2 border-b border-line bg-surface px-5 py-3">
        {CITIES.map(c => (
          <button
            key={c.id}
            onClick={() => setCity(c.id)}
            className={`rounded-full px-4 py-1.5 font-display text-xs font-bold transition ${
              city === c.id ? 'bg-gold text-bg' : 'border border-line text-dim hover:text-ink'
            }`}
          >
            {c.name}
          </button>
        ))}
        <span className="ml-auto font-mono text-xs text-dim">{reports.length} signalements actifs</span>
      </div>
      <div className="flex-1">
        <LiveMap reports={reports} center={{ lat: center.lat, lng: center.lng }} />
      </div>
    </div>
  );
}
