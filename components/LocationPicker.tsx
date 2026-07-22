'use client';

import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';

const pinIcon = L.divIcon({
  className: '',
  html: `
    <div style="
      width:30px;height:30px;border-radius:999px 999px 999px 0;
      transform:rotate(45deg);
      background:#E2453D;border:2px solid #F5F3EE;
      box-shadow:0 2px 6px rgba(0,0,0,0.4);">
    </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 28]
});

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);
  return null;
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export default function LocationPicker({
  position,
  onChange
}: {
  position: { lat: number; lng: number };
  onChange: (lat: number, lng: number) => void;
}) {
  return (
    <MapContainer center={[position.lat, position.lng]} zoom={14} scrollWheelZoom className="h-full w-full">
      <Recenter lat={position.lat} lng={position.lng} />
      <ClickHandler onPick={onChange} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker
        position={[position.lat, position.lng]}
        icon={pinIcon}
        draggable
        eventHandlers={{
          dragend: e => {
            const pos = e.target.getLatLng();
            onChange(pos.lat, pos.lng);
          }
        }}
      />
    </MapContainer>
  );
}
