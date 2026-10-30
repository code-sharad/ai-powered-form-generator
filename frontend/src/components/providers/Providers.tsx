'use client';

import { Toaster } from 'react-hot-toast';
import { usePathname } from 'next/navigation';
import { AuthInitializer } from '@/components/auth/AuthInitializer';
import { ThemeProvider } from './ThemeProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return <ThemeProvider><AuthInitializer />{children}<Toaster position={pathname === '/dashboard' ? 'top-right' : 'bottom-right'} toastOptions={{
    duration: 4000,
    style: { background: 'var(--popover)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', boxShadow: '0 6px 24px #17243b12' },
    success: { iconTheme: { primary: '#167456', secondary: '#ffffff' } },
    error: { iconTheme: { primary: '#be3838', secondary: '#ffffff' } },
  }} /></ThemeProvider>;
}
