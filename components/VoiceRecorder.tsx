'use client';

import { useRef, useState } from 'react';

export default function VoiceRecorder({ onRecorded, onCancel }: { onRecorded: (blob: Blob) => void; onCancel: () => void }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const streamRef = useRef<MediaStream | null>(null);

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("L'enregistrement audio n'est pas disponible sur cet appareil/navigateur.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = e => chunksRef.current.push(e.data);
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch {
      setError("Impossible d'accéder au micro. Vérifie les autorisations.");
    }
  }

  function stopAndSend() {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      onRecorded(blob);
      cleanup();
    };
    recorder.stop();
  }

  function cancel() {
    mediaRecorderRef.current?.stop();
    cleanup();
    onCancel();
  }

  function cleanup() {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    setRecording(false);
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-red/40 bg-red/10 px-4 py-2 text-xs text-red-light">
        {error}
        <button onClick={onCancel} className="font-bold">✕</button>
      </div>
    );
  }

  if (!recording) {
    return (
      <button
        type="button"
        onClick={start}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-surface2 text-lg text-ink"
        aria-label="Enregistrer une note vocale"
      >
        🎤
      </button>
    );
  }

  return (
    <div className="flex flex-1 items-center gap-3 rounded-full border border-red/40 bg-red/10 px-4 py-2">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-pulseRing rounded-full bg-red" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red" />
      </span>
      <span className="font-mono text-xs text-ink">{mm}:{ss}</span>
      <span className="flex-1" />
      <button onClick={cancel} aria-label="Annuler" className="text-dim hover:text-ink">✕</button>
      <button onClick={stopAndSend} aria-label="Envoyer" className="font-display text-xs font-bold text-red">Envoyer</button>
    </div>
  );
}
