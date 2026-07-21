'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import Link from 'next/link';
import { Report } from '@/lib/types';
import { getCategory } from '@/lib/categories';
import { timeAgo } from '@/lib/reportUtils';
import 'leaflet/dist/leaflet.css';

function markerIcon(categoryId: string) {
  const cat = getCategory(categoryId);
  return L.divIcon({
    className: '',
    html: `
      <div class="mboa-marker" style="width:34px;height:34px;">
        <div style="
          width:34px;height:34px;border-radius:999px;
          background:${cat.color}22;border:2px solid ${cat.color};
          display:flex;align-items:center;justify-content:center;
          font-size:16px;box-shadow:0 0 0 4px ${cat.color}14;">
          ${cat.icon}
        </div>
      </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);
  return null;
}

export default function LiveMap({
  reports,
  center
}: {
  reports: Report[];
  center: { lat: number; lng: number };
}) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={12}
      scrollWheelZoom
      className="h-full w-full"
    >
      <Recenter lat={center.lat} lng={center.lng} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {reports.map(report => (
        <Marker key={report.id} position={[report.lat, report.lng]} icon={markerIcon(report.category_id)}>
          <Popup>
            <div className="max-w-[220px] font-body">
              <p className="mb-1 font-display text-sm font-bold text-ink">{report.title}</p>
              {report.description && (
                <p className="mb-2 text-xs text-dim">{report.description}</p>
              )}
              <div className="mb-2 flex items-center justify-between text-[11px] text-dim">
                <span>{getCategory(report.category_id).label}</span>
                <span>{timeAgo(report.created_at)}</span>
              </div>
              <Link href={`/feed?report=${report.id}`} className="text-xs font-semibold text-gold">
                Voir les détails →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
