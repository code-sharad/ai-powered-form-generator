'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const ThemeContext = createContext<{ theme: Theme; setTheme: (theme: Theme) => void; toggleTheme: () => void } | null>(null);

/** Arc listens to data-theme, the app's older sheets to .dark. Both are kept in sync from one place. */
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    function syncTheme() {
      let saved: string | null = null;
      try { saved = localStorage.getItem('form-ai-theme'); } catch { /* System preference still works without storage. */ }
      const next = saved === 'light' || saved === 'dark' ? saved : media.matches ? 'dark' : 'light';
      applyTheme(next);
      setTheme(next);
    }
    syncTheme();
    media.addEventListener('change', syncTheme);
    window.addEventListener('storage', syncTheme);
    return () => { media.removeEventListener('change', syncTheme); window.removeEventListener('storage', syncTheme); };
  }, []);

  function toggleTheme() {
    selectTheme(theme === 'dark' ? 'light' : 'dark');
  }

  function selectTheme(next: Theme) {
    applyTheme(next);
    try { localStorage.setItem('form-ai-theme', next); } catch { /* Keep the selected theme for this session. */ }
    setTheme(next);
  }

  return <ThemeContext.Provider value={{ theme, setTheme: selectTheme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider.');
  return context;
}
