'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/useAuth';
import { CATEGORIES, CITIES } from '@/lib/categories';
import { CityId } from '@/lib/types';

export default function ReportPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [categoryId, setCategoryId] = useState('traffic');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cityId, setCityId] = useState<CityId>('douala');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setError("Impossible d'obtenir ta position. Autorise la géolocalisation, ou choisis la ville manuellement.");
        setLocating(false);
      }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!user) {
      router.push('/login');
      return;
    }
    if (!title.trim()) {
      setError('Ajoute un titre à ton signalement.');
      return;
    }

    const city = CITIES.find(c => c.id === cityId)!;
    const lat = coords?.lat ?? city.lat;
    const lng = coords?.lng ?? city.lng;

    setSubmitting(true);

    let mediaUrls: string[] = [];
    if (file) {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('reports-media').upload(path, file);
      if (!uploadError) {
        const { data } = supabase.storage.from('reports-media').getPublicUrl(path);
        mediaUrls = [data.publicUrl];
      }
    }

    const { error: insertError } = await supabase.from('reports').insert({
      user_id: user.id,
      category_id: categoryId,
      title: title.trim(),
      description: description.trim() || null,
      city_id: cityId,
      lat,
      lng,
      media_urls: mediaUrls
    });

    setSubmitting(false);

    if (insertError) {
      setError("Le signalement n'a pas pu être publié. Réessaie dans un instant.");
      return;
    }

    router.push('/feed');
  }

  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">Connecte-toi pour signaler</h1>
        <p className="mt-3 text-sm text-dim">
          Un compte permet de garder une trace fiable des signalements et d&apos;éviter les faux messages.
        </p>
        <a
          href="/login"
          className="mt-6 inline-block rounded-full bg-gold px-6 py-3 font-display text-sm font-bold text-bg"
        >
          Se connecter
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Signaler quelque chose</h1>
      <p className="mt-1 text-sm text-dim">Ton signalement apparaît immédiatement sur la carte et dans le flux.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {/* Catégorie */}
        <div>
          <label className="mb-2 block font-display text-xs font-bold text-dim">Catégorie</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                type="button"
                key={cat.id}
                onClick={() => setCategoryId(cat.id)}
                className={`rounded-full border px-3 py-1.5 font-display text-xs font-semibold transition ${
                  categoryId === cat.id ? 'border-gold bg-gold/15 text-gold' : 'border-line text-dim hover:text-ink'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Titre */}
        <div>
          <label className="mb-2 block font-display text-xs font-bold text-dim" htmlFor="title">Titre</label>
          <input
            id="title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ex : Embouteillage important au carrefour Bonamoussadi"
            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-gold"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-2 block font-display text-xs font-bold text-dim" htmlFor="description">
            Description (optionnel)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            placeholder="Ajoute des détails utiles..."
            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-gold"
          />
        </div>

        {/* Photo/vidéo */}
        <div>
          <label className="mb-2 block font-display text-xs font-bold text-dim" htmlFor="media">
            Photo ou vidéo (optionnel)
          </label>
          <input
            id="media"
            type="file"
            accept="image/*,video/*"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-dim file:mr-3 file:rounded-full file:border-0 file:bg-gold file:px-4 file:py-2 file:font-display file:text-xs file:font-bold file:text-bg"
          />
        </div>

        {/* Ville + position */}
        <div>
          <label className="mb-2 block font-display text-xs font-bold text-dim">Position</label>
          <div className="flex flex-wrap gap-2">
            {CITIES.map(c => (
              <button
                type="button"
                key={c.id}
                onClick={() => setCityId(c.id)}
                className={`rounded-full border px-3 py-1.5 font-display text-xs font-semibold transition ${
                  cityId === c.id ? 'border-gold bg-gold/15 text-gold' : 'border-line text-dim hover:text-ink'
                }`}
              >
                {c.name}
              </button>
            ))}
            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              className="rounded-full border border-line px-3 py-1.5 font-display text-xs font-semibold text-dim hover:text-ink"
            >
              {locating ? 'Localisation...' : coords ? '📍 Position utilisée' : '📍 Utiliser ma position GPS'}
            </button>
          </div>
        </div>

        {error && (
          <p className="rounded-lg border border-red/40 bg-red/10 px-4 py-3 text-sm text-red-light">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-gold py-3.5 font-display text-sm font-bold text-bg transition hover:bg-gold-light disabled:opacity-60"
        >
          {submitting ? 'Publication...' : 'Publier le signalement'}
        </button>
      </form>
    </div>
  );
}
