'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { INTERESTS } from '@/lib/interests';
import Logo from '@/components/Logo';

const STEPS = ['Localisation', 'Notifications', "Centres d'intérêt"];

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [notifStatus, setNotifStatus] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  function askLocation() {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => setLocationStatus('granted'),
      () => setLocationStatus('denied')
    );
  }

  async function askNotifications() {
    if (typeof Notification === 'undefined') {
      setNotifStatus('denied');
      return;
    }
    const result = await Notification.requestPermission();
    setNotifStatus(result === 'granted' ? 'granted' : 'denied');
  }

  function toggleInterest(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function finish() {
    if (!user) {
      router.push('/feed');
      return;
    }
    setSaving(true);
    await supabase
      .from('profiles')
      .update({ interests: Array.from(selected), onboarded: true })
      .eq('id', user.id);
    setSaving(false);
    router.push('/feed');
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-52px)] max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-8 flex justify-center">
        <Logo size={48} />
      </div>

      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className={`h-1 flex-1 rounded-full ${i + 1 <= step ? 'bg-red' : 'bg-line'}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="text-center">
          <span className="text-4xl">📍</span>
          <h1 className="mt-4 font-display text-xl font-bold text-ink">Active ta position</h1>
          <p className="mt-2 text-sm text-dim">
            On utilise ta position uniquement pour te montrer ce qui se passe près de chez toi.
          </p>
          {locationStatus === 'idle' && (
            <button
              onClick={askLocation}
              className="mt-6 w-full rounded-full bg-red py-3.5 font-display text-sm font-bold text-ink"
            >
              Autoriser la localisation
            </button>
          )}
          {locationStatus === 'granted' && <p className="mt-6 text-sm text-green">Position activée ✓</p>}
          {locationStatus === 'denied' && (
            <p className="mt-6 text-sm text-dim">Pas de souci, tu pourras l&apos;activer plus tard.</p>
          )}
          {locationStatus !== 'idle' && (
            <button
              onClick={() => setStep(2)}
              className="mt-6 w-full rounded-full bg-red py-3.5 font-display text-sm font-bold text-ink"
            >
              Continuer
            </button>
          )}
          {locationStatus === 'idle' && (
            <button onClick={() => setStep(2)} className="mt-3 font-display text-xs font-semibold text-dim">
              Passer cette étape
            </button>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="text-center">
          <span className="text-4xl">🔔</span>
          <h1 className="mt-4 font-display text-xl font-bold text-ink">Reste informé</h1>
          <p className="mt-2 text-sm text-dim">
            Active les notifications pour être prévenu des réponses à tes signalements et de ce qui se passe autour de toi.
          </p>
          {notifStatus === 'idle' && (
            <button
              onClick={askNotifications}
              className="mt-6 w-full rounded-full bg-red py-3.5 font-display text-sm font-bold text-ink"
            >
              Activer les notifications
            </button>
          )}
          {notifStatus === 'granted' && <p className="mt-6 text-sm text-green">Notifications activées ✓</p>}
          {notifStatus === 'denied' && (
            <p className="mt-6 text-sm text-dim">Pas de souci, tu pourras les activer plus tard.</p>
          )}
          {notifStatus !== 'idle' && (
            <button
              onClick={() => setStep(3)}
              className="mt-6 w-full rounded-full bg-red py-3.5 font-display text-sm font-bold text-ink"
            >
              Continuer
            </button>
          )}
          {notifStatus === 'idle' && (
            <button onClick={() => setStep(3)} className="mt-3 font-display text-xs font-semibold text-dim">
              Passer cette étape
            </button>
          )}
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="text-center">
            <h1 className="font-display text-xl font-bold text-ink">Tes centres d&apos;intérêt</h1>
            <p className="mt-2 text-sm text-dim">Choisis ce qui t&apos;intéresse — tu pourras changer ça plus tard.</p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {INTERESTS.map(interest => (
              <button
                key={interest.id}
                onClick={() => toggleInterest(interest.id)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition ${
                  selected.has(interest.id) ? 'border-red bg-red/15 text-red' : 'border-line text-ink'
                }`}
              >
                <span>{interest.icon}</span>
                {interest.label}
              </button>
            ))}
          </div>

          <button
            onClick={finish}
            disabled={saving}
            className="mt-8 w-full rounded-full bg-red py-3.5 font-display text-sm font-bold text-ink disabled:opacity-60"
          >
            {saving ? 'Un instant...' : 'Commencer'}
          </button>
        </div>
      )}
    </div>
  );
}
