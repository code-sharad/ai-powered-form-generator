'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export function SignedOutOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isHydrated, router]);

  if (isHydrated && isAuthenticated) {
    return (
      <main className="auth-shell auth-verify-page">
        <section className="auth-content">
          <div className="auth-form-wrap auth-verify-card auth-verify-state">
            <p>Taking you to your dashboard…</p>
          </div>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
