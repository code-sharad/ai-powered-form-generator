'use client';

import { Toaster } from 'react-hot-toast';
import { AuthInitializer } from '@/components/auth/AuthInitializer';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthInitializer />
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#0a0a0a',
            color: '#fff',
            border: '1px solid #333333',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '13px',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
          },
          success: {
            duration: 3000,
            style: {
              background: '#0a0a0a',
              border: '1px solid #063326',
            },
            iconTheme: {
              primary: '#10b981',
              secondary: '#0a0a0a',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#0a0a0a',
              border: '1px solid #ef4444',
            },
            iconTheme: {
              primary: '#ef4444',
              secondary: '#0a0a0a',
            },
          },
          loading: {
            style: {
              background: '#0a0a0a',
              border: '1px solid #666666',
            },
            iconTheme: {
              primary: '#a1a1a1',
              secondary: '#0a0a0a',
            },
          },
        }}
      />
    </>
  );
}
