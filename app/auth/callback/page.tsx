'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';

export default function AuthCallbackPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    router.replace(profile?.onboarded ? '/feed' : '/onboarding');
  }, [user, profile, loading, router]);

  return (
    <div className="flex h-[calc(100vh-64px)] items-center justify-center text-sm text-dim">
      Connexion en cours...
    </div>
  );
}