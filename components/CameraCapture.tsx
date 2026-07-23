'use client';

import { useEffect, useRef, useState } from 'react';

type Mode = 'photo' | 'video';

export default function CameraCapture({
  mode,
  onCapture,
  onClose
}: {
  mode: Mode;
  onCapture: (file: File) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const [facing, setFacing] = useState<'user' | 'environment'>('environment');
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCamera() {
    stopCamera();
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
        audio: mode === 'video'
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setError("Impossible d'accéder à la caméra. Vérifie les autorisations de ton navigateur.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing, mode]);

  function takePhoto() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (blob) {
        setPreviewBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
      }
    }, 'image/jpeg', 0.9);
  }

  function startRecording() {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current);
    recorder.ondataavailable = e => chunksRef.current.push(e.data);
    recorder.start();
    recorderRef.current = recorder;
    setRecording(true);
    setSeconds(0);
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
  }

  function stopRecording() {
    const recorder = recorderRef.current;
    if (!recorder) return;
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setPreviewBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
    };
    recorder.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
  }

  function retake() {
    setPreviewUrl(null);
    setPreviewBlob(null);
    startCamera();
  }

  function confirm() {
    if (!previewBlob) return;
    const ext = mode === 'video' ? 'webm' : 'jpg';
    const file = new File([previewBlob], `capture-${Date.now()}.${ext}`, {
      type: previewBlob.type || (mode === 'video' ? 'video/webm' : 'image/jpeg')
    });
    onCapture(file);
  }

  function pickFromGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) onCapture(f);
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={onClose} aria-label="Fermer" className="text-2xl text-ink">✕</button>
        {!previewUrl && (
          <button onClick={() => setFacing(f => (f === 'user' ? 'environment' : 'user'))} aria-label="Changer de caméra" className="text-2xl text-ink">
            🔄
          </button>
        )}
      </div>

      <div className="relative flex-1 overflow-hidden">
        {error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
            <span className="text-3xl">⚠️</span>
            <p className="text-sm text-dim">{error}</p>
            <button onClick={startCamera} className="rounded-full bg-red px-4 py-2 font-display text-xs font-bold text-ink">
              Réessayer
            </button>
          </div>
        ) : previewUrl ? (
          mode === 'video' ? (
            <video src={previewUrl} controls autoPlay loop className="h-full w-full object-contain" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Aperçu" className="h-full w-full object-contain" />
          )
        ) : (
          <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
        )}

        {recording && (
          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-red/90 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-ink" />
            <span className="font-mono text-xs font-bold text-ink">{mm}:{ss}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-8 px-6 py-8">
        {previewUrl ? (
          <>
            <button
              onClick={retake}
              className="rounded-full border border-line px-5 py-3 font-display text-sm font-bold text-ink"
            >
              Reprendre
            </button>
            <button
              onClick={confirm}
              className="rounded-full bg-red px-6 py-3 font-display text-sm font-bold text-ink"
            >
              Utiliser
            </button>
          </>
        ) : mode === 'photo' ? (
          <>
            <label className="font-display text-xs font-semibold text-dim underline">
              Galerie
              <input type="file" accept="image/*" className="hidden" onChange={pickFromGallery} />
            </label>
            <button
              onClick={takePhoto}
              aria-label="Prendre la photo"
              className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-ink bg-ink/20"
            >
              <span className="h-12 w-12 rounded-full bg-ink" />
            </button>
            <span className="w-12" />
          </>
        ) : (
          <>
            <label className="font-display text-xs font-semibold text-dim underline">
              Galerie
              <input type="file" accept="video/*" className="hidden" onChange={pickFromGallery} />
            </label>
            <button
              onClick={recording ? stopRecording : startRecording}
              aria-label={recording ? 'Arrêter' : 'Filmer'}
              className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-ink"
            >
              <span className={`bg-red transition-all ${recording ? 'h-6 w-6 rounded-md' : 'h-12 w-12 rounded-full'}`} />
            </button>
            <span className="w-12" />
          </>
        )}
      </div>
    </div>
  );
}
