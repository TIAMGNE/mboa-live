'use client';

import { Suspense, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/useAuth';
import { CATEGORIES, CITIES } from '@/lib/categories';
import { CityId } from '@/lib/types';
import PlaceSearch from '@/components/PlaceSearch';
import CameraCapture from '@/components/CameraCapture';

// Leaflet a besoin du navigateur (window/document) : pas de rendu serveur.
const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="flex h-48 items-center justify-center rounded-2xl border border-line bg-surface text-sm text-dim">
      Chargement de la carte...
    </div>
  )
});

type MediaKind = 'photo' | 'video';

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-xl px-5 py-10 text-sm text-dim">Chargement...</div>}>
      <ReportForm />
    </Suspense>
  );
}

function ReportForm() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();

  const [step, setStep] = useState(1);
  const [categoryId, setCategoryId] = useState('voirie');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cityId, setCityId] = useState<CityId>('douala');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [placeLabel, setPlaceLabel] = useState<string | null>(null);
  const [mediaKind, setMediaKind] = useState<MediaKind>('photo');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Arrivée depuis le bottom sheet "+" : préremplit selon le raccourci choisi.
  useEffect(() => {
    const media = params.get('media');
    if (media === 'video' || media === 'photo') setMediaKind(media);
    if (params.get('camera') === '1') setCameraOpen(true);
    if (params.get('emergency') === '1') setIsEmergency(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mapCenter = coords ?? CITIES.find(c => c.id === cityId)!;

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setPlaceLabel(null);
        setLocating(false);
      },
      () => {
        setError("Impossible d'obtenir ta position. Autorise la géolocalisation, ou choisis la ville manuellement.");
        setLocating(false);
      }
    );
  }

  function goToLocalisation() {
    setError(null);
    if (!title.trim()) {
      setError('Ajoute un titre à ton signalement.');
      return;
    }
    setStep(2);
  }

  async function handlePublish() {
    if (!user) {
      router.push('/login');
      return;
    }
    setError(null);
    setSubmitting(true);

    const city = CITIES.find(c => c.id === cityId)!;
    const lat = coords?.lat ?? city.lat;
    const lng = coords?.lng ?? city.lng;

    let mediaUrls: string[] = [];
    if (file) {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('reports-media').upload(path, file);
      if (uploadError) {
        setSubmitting(false);
        setError(`La photo/vidéo n'a pas pu être envoyée : ${uploadError.message}`);
        return;
      }
      const { data } = supabase.storage.from('reports-media').getPublicUrl(path);
      mediaUrls = [data.publicUrl];
    }

    const { error: insertError } = await supabase.from('reports').insert({
      user_id: user.id,
      category_id: categoryId,
      title: title.trim(),
      description: description.trim() || null,
      city_id: cityId,
      lat,
      lng,
      media_urls: mediaUrls,
      media_type: file ? mediaKind : null,
      is_emergency: isEmergency
    });

    setSubmitting(false);

    if (insertError) {
      // Le trigger anti-spam renvoie un message clair et destiné à l'utilisateur ;
      // sinon on garde un message générique.
      setError(
        insertError.code === 'P0001'
          ? insertError.message
          : "Le signalement n'a pas pu être publié. Réessaie dans un instant."
      );
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
        <a href="/login" className="mt-6 inline-block rounded-full bg-red px-6 py-3 font-display text-sm font-bold text-ink">
          Se connecter
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-8">
      <div className="flex items-center gap-3">
        {step > 1 && (
          <button onClick={() => setStep(s => s - 1)} aria-label="Retour" className="text-dim hover:text-ink">←</button>
        )}
        <h1 className="font-display text-lg font-bold text-ink">
          {step === 1 && 'Signaler un problème'}
          {step === 2 && 'Choisir la localisation'}
          {step === 3 && 'Ajouter média'}
          {step === 4 && 'Récapitulatif'}
        </h1>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red/40 bg-red/10 px-4 py-3 text-sm text-red-light">{error}</p>
      )}

      {/* Étape 1 : type + titre + description */}
      {step === 1 && (
        <div className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block font-display text-xs font-bold text-dim">Type de problème</label>
            <div className="flex gap-3">
              {CATEGORIES.map(cat => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategoryId(cat.id)}
                  className="flex flex-col items-center gap-1.5"
                >
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full text-lg transition"
                    style={{
                      background: categoryId === cat.id ? cat.color : `${cat.color}22`,
                      border: `2px solid ${cat.color}`
                    }}
                  >
                    {cat.icon}
                  </span>
                  <span className={`text-[10px] font-semibold ${categoryId === cat.id ? 'text-ink' : 'text-dim'}`}>
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block font-display text-xs font-bold text-dim" htmlFor="title">Titre du signalement</label>
            <input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex : Nids-de-poule sur la route principale"
              className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-red"
              required
            />
          </div>

          <div>
            <label className="mb-2 block font-display text-xs font-bold text-dim" htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              placeholder="Décrivez le problème en détail..."
              className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-red"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsEmergency(v => !v)}
            className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
              isEmergency ? 'border-red bg-red/10' : 'border-line'
            }`}
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-ink">
              🚨 Signaler comme urgence
            </span>
            <span
              className={`flex h-6 w-11 items-center rounded-full p-0.5 transition ${isEmergency ? 'bg-red' : 'bg-surface2'}`}
            >
              <span
                className={`h-5 w-5 rounded-full bg-ink transition-transform ${isEmergency ? 'translate-x-5' : ''}`}
              />
            </span>
          </button>

          <button
            type="button"
            onClick={goToLocalisation}
            className="w-full rounded-full bg-red py-3.5 font-display text-sm font-bold text-ink transition hover:bg-red-light"
          >
            Continuer
          </button>
        </div>
      )}

      {/* Étape 2 : localisation */}
      {step === 2 && (
        <div className="mt-6 space-y-5">
          <PlaceSearch
            onSelect={(lat, lng, label) => {
              setCoords({ lat, lng });
              setPlaceLabel(label);
            }}
          />
          <div className="flex flex-wrap gap-2">
            {CITIES.map(c => (
              <button
                type="button"
                key={c.id}
                onClick={() => {
                  setCityId(c.id);
                  setCoords(null);
                  setPlaceLabel(null);
                }}
                className={`rounded-full border px-3 py-1.5 font-display text-xs font-semibold transition ${
                  cityId === c.id && !coords ? 'border-red bg-red/15 text-red' : 'border-line text-dim hover:text-ink'
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
          <p className="text-xs text-dim">
            {placeLabel ? placeLabel : 'Astuce : clique directement sur la carte, ou fais glisser le repère, pour ajuster la position exacte.'}
          </p>
          <div className="h-56 overflow-hidden rounded-2xl border border-line">
            <LocationPicker
              position={mapCenter}
              onChange={(lat, lng) => {
                setCoords({ lat, lng });
                setPlaceLabel(null);
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => setStep(3)}
            className="w-full rounded-full bg-red py-3.5 font-display text-sm font-bold text-ink transition hover:bg-red-light"
          >
            Confirmer la localisation
          </button>
        </div>
      )}

      {/* Étape 3 : média */}
      {step === 3 && (
        <div className="mt-6 space-y-5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMediaKind('video')}
              className={`flex-1 rounded-full py-2 font-display text-xs font-bold transition ${
                mediaKind === 'video' ? 'bg-red text-ink' : 'border border-line text-dim'
              }`}
            >
              Vidéo
            </button>
            <button
              type="button"
              onClick={() => setMediaKind('photo')}
              className={`flex-1 rounded-full py-2 font-display text-xs font-bold transition ${
                mediaKind === 'photo' ? 'bg-red text-ink' : 'border border-line text-dim'
              }`}
            >
              Photo
            </button>
          </div>

          {previewUrl ? (
            <div className="relative overflow-hidden rounded-2xl border border-line bg-surface">
              {mediaKind === 'video' ? (
                <video src={previewUrl} controls className="h-48 w-full object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Aperçu" className="h-48 w-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreviewUrl(null);
                }}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-ink"
                aria-label="Retirer"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCameraOpen(true)}
                className="flex h-32 flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-surface text-sm text-dim"
              >
                <span className="text-2xl">📸</span>
                <span>Utiliser la caméra</span>
              </button>
              <label className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-surface text-sm text-dim">
                <span className="text-2xl">🖼️</span>
                <span>Depuis la galerie</span>
                <input
                  type="file"
                  accept={mediaKind === 'video' ? 'video/*' : 'image/*'}
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0] ?? null;
                    setFile(f);
                    setPreviewUrl(f ? URL.createObjectURL(f) : null);
                  }}
                />
              </label>
            </div>
          )}

          {cameraOpen && (
            <CameraCapture
              mode={mediaKind}
              onClose={() => setCameraOpen(false)}
              onCapture={f => {
                setFile(f);
                setPreviewUrl(URL.createObjectURL(f));
                setCameraOpen(false);
              }}
            />
          )}

          <button
            type="button"
            onClick={() => setStep(4)}
            className="w-full rounded-full bg-red py-3.5 font-display text-sm font-bold text-ink transition hover:bg-red-light"
          >
            Publier
          </button>
        </div>
      )}

      {/* Étape 4 : récapitulatif */}
      {step === 4 && (
        <div className="mt-6 space-y-5">
          <div className="space-y-3 rounded-2xl border border-line bg-surface p-4">
            <p className="font-display text-base font-bold text-ink">
              {isEmergency && <span className="mr-1.5 rounded-full bg-red px-2 py-0.5 text-xs text-ink">🚨 Urgence</span>}
              {title || '(sans titre)'}
            </p>
            {description && <p className="text-sm text-dim">{description}</p>}
            <p className="text-xs text-dim">
              {CATEGORIES.find(c => c.id === categoryId)?.label} · {cityId === 'douala' ? 'Douala' : 'Yaoundé'}
              {coords ? ' · position précise sélectionnée' : ''}
            </p>
            {file && <p className="text-xs text-dim">📎 {file.name}</p>}
          </div>

          <button
            type="button"
            onClick={handlePublish}
            disabled={submitting}
            className="w-full rounded-full bg-red py-3.5 font-display text-sm font-bold text-ink transition hover:bg-red-light disabled:opacity-60"
          >
            {submitting ? 'Publication...' : 'Publier le signalement'}
          </button>
        </div>
      )}
    </div>
  );
}
