'use client';

import { useEffect, useRef, useState } from 'react';

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
}

export default function PlaceSearch({
  onSelect
}: {
  onSelect: (lat: number, lng: number, label: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!query.trim() || query.trim().length < 3) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&countrycodes=cm&limit=6&q=${encodeURIComponent(query)}`
        );
        const data = (await res.json()) as Suggestion[];
        setResults(data);
        setOpen(true);
      } catch {
        // Recherche indisponible (hors ligne, ou service externe injoignable) :
        // on laisse l'utilisateur choisir sa ville / sa position GPS à la place.
        setResults([]);
      }
      setSearching(false);
    }, 450);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div className="relative">
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Rechercher un lieu (ex : Carrefour Ndokoti, Douala)"
        className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-red"
      />
      {searching && <p className="mt-1 text-xs text-dim">Recherche...</p>}

      {open && results.length > 0 && (
        <div className="absolute inset-x-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-xl border border-line bg-surface shadow-lg">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                onSelect(parseFloat(r.lat), parseFloat(r.lon), r.display_name);
                setQuery(r.display_name);
                setOpen(false);
              }}
              className="block w-full border-b border-line px-4 py-2.5 text-left text-xs text-ink last:border-b-0 hover:bg-surface2"
            >
              {r.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
