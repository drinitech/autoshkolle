import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from './types';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'autoshkolle-auth' }
  )
);

// Zustand's persist storage isn't available during Next's static-shell
// prerendering — never call useAuthStore.persist.hasHydrated() in render.
// Components that need to gate on "are we hydrated yet" should track it
// themselves via useState + useEffect instead.
