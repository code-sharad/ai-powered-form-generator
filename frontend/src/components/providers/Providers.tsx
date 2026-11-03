'use client';

import { AuthInitializer } from '@/components/auth/AuthInitializer';
import { ThemeProvider } from './ThemeProvider';
import { ArcToaster } from './ArcToaster';

export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider><AuthInitializer />{children}<ArcToaster /></ThemeProvider>;
}
