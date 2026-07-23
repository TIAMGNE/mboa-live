'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Report } from '@/lib/types';
import ReportCard from '@/components/ReportCard';

interface UserResult {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface PlaceResult {
  display_name: string;
  lat: string;
  lon: string;
}

type Tab = 'tous' | 'personnes' | 'signalements' | 'lieux';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('tous');
  const [users, setUsers] = useState<UserResult[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setUsers([]);
      setReports([]);
      setPlaces([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(runSearch, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function runSearch() {
    setSearching(true);
    const q = query.trim();

    const [usersRes, reportsRes, placesRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, bio')
        .or(`full_name.ilike.%${q}%,username.ilike.%${q}%`)
        .limit(10),
      supabase
        .from('reports')
        .select('*, author:profiles!user_id(full_name, username, avatar_url)')
        .neq('status', 'removed')
        .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
        .order('created_at', { ascending: false })
        .limit(12),
      fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=cm&limit=8&q=${encodeURIComponent(q)}`)
        .then(r => r.json())
        .catch(() => [])
    ]);

    setUsers((usersRes.data as UserResult[]) || []);
    setReports((reportsRes.data as unknown as Report[]) || []);
    setPlaces(placesRes || []);
    setSearching(false);
  }

  const showUsers = tab === 'tous' || tab === 'personnes';
  const showReports = tab === 'tous' || tab === 'signalements';
  const showPlaces = tab === 'tous' || tab === 'lieux';
  const hasQuery = query.trim().length >= 2;
  const hasAnyResult = users.length > 0 || reports.length > 0 || places.length > 0;

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <h1 className="font-display text-2xl font-bold text-ink">Rechercher</h1>
      <p className="mt-1 text-sm text-dim">Personnes, signalements, lieux et quartiers du Cameroun.</p>

      <input
        autoFocus
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Rechercher une personne, un lieu, un signalement..."
        className="mt-4 w-full rounded-full border border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-red"
      />

      <div className="mt-4 flex gap-2">
        {(['tous', 'personnes', 'signalements', 'lieux'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full border px-3 py-1.5 font-display text-xs font-semibold capitalize transition ${
              tab === t ? 'border-red bg-red/15 text-red' : 'border-line text-dim hover:text-ink'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {!hasQuery && (
        <p className="mt-10 text-center text-sm text-dim">Tape au moins 2 caractères pour lancer la recherche.</p>
      )}

      {hasQuery && searching && <p className="mt-6 text-sm text-dim">Recherche...</p>}

      {hasQuery && !searching && !hasAnyResult && (
        <p className="mt-10 text-center text-sm text-dim">Aucun résultat pour &laquo;&nbsp;{query}&nbsp;&raquo;.</p>
      )}

      {hasQuery && !searching && showUsers && users.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 font-display text-sm font-bold text-ink">Personnes</h2>
          <div className="space-y-1">
            {users.map(u => (
              <Link
                key={u.id}
                href={`/profile/${u.id}`}
                className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface2"
              >
                {u.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.avatar_url} alt={u.full_name || ''} className="h-11 w-11 rounded-full object-cover" />
                ) : (
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface2 font-display text-sm font-bold text-ink">
                    {(u.full_name || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-bold text-ink">{u.full_name || 'Utilisateur MBOA'}</p>
                  <p className="truncate text-xs text-dim">{u.username ? `@${u.username}` : ''} {u.bio ? `· ${u.bio}` : ''}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {hasQuery && !searching && showReports && reports.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-sm font-bold text-ink">Signalements</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {reports.map(r => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
        </section>
      )}

      {hasQuery && !searching && showPlaces && places.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-sm font-bold text-ink">Lieux</h2>
          <p className="mb-2 text-xs text-dim">
            Recherche géographique (OpenStreetMap) — pas encore un annuaire de commerces vérifiés.
          </p>
          <div className="space-y-1">
            {places.map((p, i) => (
              <a
                key={i}
                href={`https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}#map=16/${p.lat}/${p.lon}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl px-3 py-2.5 text-sm text-ink hover:bg-surface2"
              >
                📍 {p.display_name}
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
