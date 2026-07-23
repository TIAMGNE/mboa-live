'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { CITIES } from '@/lib/categories';
import { CityId } from '@/lib/types';

export default function EditProfilePage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [username, setUsername] = useState('');
  const [city, setCity] = useState<CityId | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name || '');
    setUsername(profile.username || '');
    setCity(profile.city);
    setBio(profile.bio || '');
    setAvatarPreview(profile.avatar_url);
  }, [profile]);

  function onPickAvatar(f: File | null) {
    setAvatarFile(f);
    if (f) setAvatarPreview(URL.createObjectURL(f));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);

    if (!fullName.trim()) {
      setError('Le nom complet ne peut pas être vide.');
      return;
    }
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (username.trim() && cleanUsername !== username.trim().toLowerCase()) {
      setError("Le nom d'utilisateur ne peut contenir que des lettres, chiffres et underscores.");
      return;
    }

    setSaving(true);

    let avatarUrl = profile?.avatar_url ?? null;
    if (avatarFile) {
      const path = `${user.id}/${Date.now()}-${avatarFile.name}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true });
      if (uploadError) {
        setSaving(false);
        setError(`La photo n'a pas pu être envoyée : ${uploadError.message}`);
        return;
      }
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      avatarUrl = data.publicUrl;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        bio: bio.trim() || null,
        username: cleanUsername || null,
        city,
        avatar_url: avatarUrl
      })
      .eq('id', user.id);

    setSaving(false);

    if (updateError) {
      if (updateError.code === '23505') {
        setError("Ce nom d'utilisateur est déjà pris. Choisis-en un autre.");
      } else {
        setError(`Impossible d'enregistrer : ${updateError.message}`);
      }
      return;
    }

    router.push('/profile');
  }

  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-sm px-5 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">Pas encore connecté</h1>
        <a href="/login" className="mt-6 inline-block rounded-full bg-red px-6 py-3 font-display text-sm font-bold text-ink">
          Se connecter
        </a>
      </div>
    );
  }

  const initial = (fullName || 'U').trim().charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-sm px-5 py-10">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} aria-label="Retour" className="text-dim hover:text-ink">←</button>
        <h1 className="font-display text-lg font-bold text-ink">Modifier le profil</h1>
      </div>

      <form onSubmit={handleSave} className="mt-8 space-y-5">
        <div className="flex flex-col items-center gap-3">
          <label className="relative cursor-pointer">
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarPreview} alt="Avatar" className="h-24 w-24 rounded-full border-2 border-line object-cover" />
            ) : (
              <span className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-line bg-surface font-display text-2xl font-bold text-ink">
                {initial}
              </span>
            )}
            <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-red text-sm text-ink">
              📷
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => onPickAvatar(e.target.files?.[0] ?? null)}
            />
          </label>
          <p className="text-xs text-dim">Touche l&apos;icône pour changer de photo</p>
        </div>

        <div>
          <label className="mb-2 block font-display text-xs font-bold text-dim" htmlFor="fullName">Nom complet</label>
          <input
            id="fullName"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-red"
            required
          />
        </div>

        <div>
          <label className="mb-2 block font-display text-xs font-bold text-dim" htmlFor="username">Nom d&apos;utilisateur</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-dim">@</span>
            <input
              id="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="ex_237"
              className="w-full rounded-xl border border-line bg-surface py-3 pl-8 pr-4 text-sm text-ink outline-none focus:border-red"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block font-display text-xs font-bold text-dim" htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            value={bio}
            onChange={e => setBio(e.target.value.slice(0, 150))}
            rows={3}
            placeholder="Une phrase pour te présenter..."
            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-red"
          />
          <p className="mt-1 text-right text-[11px] text-dim">{bio.length}/150</p>
        </div>

        <div>
          <label className="mb-2 block font-display text-xs font-bold text-dim">Ville</label>
          <div className="flex gap-2">
            {CITIES.map(c => (
              <button
                type="button"
                key={c.id}
                onClick={() => setCity(c.id)}
                className={`rounded-full border px-3 py-1.5 font-display text-xs font-semibold ${
                  city === c.id ? 'border-red bg-red/15 text-red' : 'border-line text-dim'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-light">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-full bg-red py-3 font-display text-sm font-bold text-ink disabled:opacity-60"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </form>
    </div>
  );
}
