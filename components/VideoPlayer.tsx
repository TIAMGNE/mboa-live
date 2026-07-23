'use client';

import { useEffect, useRef, useState } from 'react';

const SPEEDS = [1, 1.5, 2, 0.5];
const DOUBLE_TAP_DELAY = 300;

interface VideoPlayerProps {
  src: string;
  className?: string;
  active: boolean;
  nearby: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onDoubleTapLike: () => void;
}

function getPreloadStrategy(): 'auto' | 'metadata' {
  if (typeof navigator === 'undefined') return 'metadata';
  // @ts-expect-error - API expérimentale, pas typée partout
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn?.saveData) return 'metadata';
  if (conn?.effectiveType && /2g/.test(conn.effectiveType)) return 'metadata';
  return 'auto';
}

export default function VideoPlayer({ src, className, active, nearby, muted, onToggleMute, onDoubleTapLike }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTapRef = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [showPauseIcon, setShowPauseIcon] = useState(false);
  const [heartBurstKey, setHeartBurstKey] = useState(0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);

  // Le réglage son/muet est partagé entre toutes les vidéos du feed (voir
  // VerticalFeed) : une fois activé par la personne, ça reste activé pour
  // les vidéos suivantes, au lieu de redémarrer muet à chaque fois.
  useEffect(() => {
    const v = videoRef.current;
    if (v) v.muted = muted;
  }, [muted]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active && !hasError) {
      v.muted = muted;
      const playPromise = v.play();
      if (playPromise) playPromise.then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      v.pause();
      setPlaying(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, hasError]);

  function togglePlay() {
    const v = videoRef.current;
    if (!v || !active) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
    setShowPauseIcon(true);
    setTimeout(() => setShowPauseIcon(false), 450);
  }

  function handleTap() {
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      onDoubleTapLike();
      setHeartBurstKey(k => k + 1);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      setTimeout(() => {
        if (Date.now() - lastTapRef.current >= DOUBLE_TAP_DELAY) togglePlay();
      }, DOUBLE_TAP_DELAY + 10);
    }
  }

  function handleToggleMute(e: React.MouseEvent) {
    e.stopPropagation();
    onToggleMute();
  }

  function cycleSpeed(e: React.MouseEvent) {
    e.stopPropagation();
    const nextIndex = (speedIndex + 1) % SPEEDS.length;
    setSpeedIndex(nextIndex);
    if (videoRef.current) videoRef.current.playbackRate = SPEEDS[nextIndex];
  }

  function handleTimeUpdate() {
    const v = videoRef.current;
    if (!v || !v.duration || seeking) return;
    setProgress(v.currentTime / v.duration);
  }

  function handleLoadedMetadata() {
    const v = videoRef.current;
    if (v) setDuration(v.duration);
  }

  function seekTo(e: React.MouseEvent<HTMLDivElement>) {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    v.currentTime = ratio * duration;
    setProgress(ratio);
  }

  function retry() {
    setHasError(false);
    setIsBuffering(true);
    const v = videoRef.current;
    if (v) {
      v.load();
      if (active) v.play().catch(() => {});
    }
  }

  const preload = active || nearby ? getPreloadStrategy() : 'none';

  return (
    <div className="absolute inset-0 z-0" onClick={handleTap}>
      {!hasError ? (
        <video
          ref={videoRef}
          src={nearby || active ? src : undefined}
          className={className}
          loop
          playsInline
          preload={preload}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => setIsBuffering(false)}
          onCanPlay={() => setIsBuffering(false)}
          onError={() => {
            setHasError(true);
            setIsBuffering(false);
          }}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-surface2 px-6 text-center">
          <span className="text-3xl">⚠️</span>
          <p className="text-sm text-dim">Impossible de charger la vidéo.</p>
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              retry();
            }}
            className="rounded-full bg-red px-4 py-2 font-display text-xs font-bold text-ink"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Indicateur de chargement de la vidéo elle-même — disparaît dès
         qu'elle commence à jouer. Différent du badge de statut du
         signalement (En attente / En cours / Résolu, en haut de l'écran),
         qui reste affiché : il donne une information différente. */}
      {!hasError && isBuffering && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="h-9 w-9 animate-spin rounded-full border-2 border-ink/25 border-t-ink" />
        </div>
      )}

      {showPauseIcon && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/50 text-3xl text-ink">
            {playing ? '▶' : '❚❚'}
          </span>
        </div>
      )}

      {heartBurstKey > 0 && (
        <div key={heartBurstKey} className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="animate-heartBurst text-8xl">❤️</span>
        </div>
      )}

      {!hasError && (
        <div className="absolute left-4 top-28 z-20 flex gap-2">
          <button
            type="button"
            onClick={handleToggleMute}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-base text-ink backdrop-blur"
            aria-label={muted ? 'Activer le son' : 'Couper le son'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
          <button
            type="button"
            onClick={cycleSpeed}
            className="flex h-9 items-center justify-center rounded-full bg-black/60 px-3 font-display text-xs font-bold text-ink backdrop-blur"
            aria-label="Changer la vitesse de lecture"
          >
            {SPEEDS[speedIndex]}x
          </button>
        </div>
      )}

      {!hasError && duration > 0 && (
        <div
          className="absolute inset-x-0 bottom-0 z-20 h-1.5 cursor-pointer bg-ink/20"
          onClick={seekTo}
          onMouseDown={() => setSeeking(true)}
          onMouseUp={() => setSeeking(false)}
        >
          <div className="h-full bg-red transition-[width]" style={{ width: `${progress * 100}%` }} />
        </div>
      )}
    </div>
  );
}
