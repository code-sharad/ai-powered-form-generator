'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { VisitorsLanding } from '@/components/marketing/VisitorsLanding';
import { useAuthStore } from '@/store/authStore';

export default function Home() {
  const router = useRouter();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isHydrated && isAuthenticated) router.replace('/dashboard');
  }, [isHydrated, isAuthenticated, router]);

  if (!isHydrated || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Loading Formora">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current" aria-hidden="true" />
      </div>
    );
  }

  return <VisitorsLanding />;
}
