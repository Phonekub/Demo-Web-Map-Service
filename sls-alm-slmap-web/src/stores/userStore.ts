import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { User } from '@/types';
import * as authService from '@/services/auth.service';

interface UserState {
  // State
  user: User | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useUserStore = create<UserState>()(
  devtools(
    set => ({
      // Initial state
      user: null,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user: User) => set({ user, error: null }, false, 'setUser'),

      updateUser: (updates: Partial<User>) =>
        set(
          state => ({
            user: state.user ? { ...state.user, ...updates } : null,
          }),
          false,
          'updateUser'
        ),

      clearUser: () => set({ user: null, error: null }, false, 'clearUser'),

      setLoading: (isLoading: boolean) => set({ isLoading }, false, 'setLoading'),

      setError: (error: string | null) => set({ error }, false, 'setError'),

      // Auth actions
      login: async (_email: string, _password: string) => {
        set({ isLoading: true, error: null }, false, 'login:start');

        try {
          // This is handled by OAuth2 flow
          // User will be set via setUser after OAuth2 callback
          set(
            {
              isLoading: false,
              error: null,
            },
            false,
            'login:success'
          );
        } catch {
          set(
            {
              isLoading: false,
              error: 'Login failed. Please try again.',
            },
            false,
            'login:error'
          );
        }
      },

      logout: async () => {
        try {
          // Clear user from store first
          set(
            {
              user: null,
              error: null,
            },
            false,
            'logout:clear'
          );

          // Call logout API
          const redirectUrl = await authService.logout();

          // Redirect to the URL provided by the backend
          window.location.href = redirectUrl;
        } catch (error) {
          console.error('Logout error:', error);
          // Even if API call fails, keep user cleared and try to redirect to login
          window.location.href = '/login';
        }
      },
    }),
    {
      name: 'user-store',
      enabled: import.meta.env.DEV,
    }
  )
);
