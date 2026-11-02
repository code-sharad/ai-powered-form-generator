'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Brand } from '@/components/layout/Brand';
import { useAuth } from '@/hooks/useAuth';
import '@/app/auth.css';

function VerifyShell({ failed = false, message = '' }: { failed?: boolean; message?: string }) {
  return (
    <main className="auth-shell auth-verify-page">
      <section className="auth-content">
        <div className="auth-form-wrap auth-verify-card">
          <div className="auth-verify-brand"><Brand /></div>
          {failed ? (
            <div className="auth-verify-state">
              <p className="auth-verify-error">{message}</p>
              <Link href="/login" className="action-button">Request a new link</Link>
            </div>
          ) : (
            <div className="auth-verify-state">
              <Loader2 size={22} className="animate-spin auth-verify-spinner" />
              <p>Signing you in…</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function VerifyContent() {
  const { verifyMagicLink } = useAuth();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const startedRef = useRef(false);
  const [failed, setFailed] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (!token) {
      setMessage('This link is invalid or has expired. Request a new one.');
      setFailed(true);
      return;
    }

    verifyMagicLink(token).then((result) => {
      if (!result.success) {
        setMessage(result.error || 'This link is invalid or has expired. Request a new one.');
        setFailed(true);
      }
    });
  }, [token, verifyMagicLink]);

  return <VerifyShell failed={failed} message={message} />;
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<VerifyShell />}>
      <VerifyContent />
    </Suspense>
  );
}
