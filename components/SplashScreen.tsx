'use client';

import { useEffect, useState } from 'react';
import Logo, { Wordmark } from './Logo';

export default function SplashScreen() {
  const [mounted, setMounted] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const startFadeOut = setTimeout(() => setFadingOut(true), 1000);
    const unmount = setTimeout(() => setMounted(false), 1400);
    return () => {
      clearTimeout(startFadeOut);
      clearTimeout(unmount);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg transition-opacity duration-[400ms] ${
        fadingOut ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <div className="animate-splashLogoIn flex flex-col items-center">
        <Logo size={64} />
        <div className="mt-4">
          <Wordmark className="text-2xl" />
        </div>
      </div>

      <p className="animate-splashFadeIn mt-3 font-display text-xs font-semibold tracking-wide text-dim">
        Découvrez le Cameroun en temps réel.
      </p>

      <div className="animate-splashFadeIn mt-8 flex gap-1.5">
        <span className="h-1.5 w-1.5 animate-splashDot rounded-full bg-red" style={{ animationDelay: '0ms' }} />
        <span className="h-1.5 w-1.5 animate-splashDot rounded-full bg-red" style={{ animationDelay: '150ms' }} />
        <span className="h-1.5 w-1.5 animate-splashDot rounded-full bg-red" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
