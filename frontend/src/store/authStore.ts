import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Cookies from 'js-cookie';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;

  // Actions
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  initializeAuth: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isHydrated: false,

      setAuth: (user, token) => {
        // Store token in cookie (more secure than localStorage)
        Cookies.set('token', token, {
          expires: 7, // 7 days
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        });

        set({
          user,
          token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        Cookies.remove('token');

        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },

      // Initialize auth state from cookie on app load
      initializeAuth: () => {
        const token = Cookies.get('token');
        const currentState = get();

        if (token && currentState.user) {
          // Token exists and we have user data from localStorage
          set({
            token,
            isAuthenticated: true,
          });
        } else if (!token) {
          // No token, clear everything
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },

      setHydrated: () => {
        set({ isHydrated: true });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        // Don't persist token or isAuthenticated - we'll restore from cookie
      }),
      onRehydrateStorage: () => (state) => {
        // After rehydration, initialize from cookie
        state?.initializeAuth();
        state?.setHydrated();
      },
    }
  )
);
