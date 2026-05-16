/**
 * FinSight — Auth Store (Zustand)
 * Manages authentication state on the client
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile, AuthState } from "@/types";

interface AuthStore extends AuthState {
  accessToken: string | null;
  setUser: (user: Profile | null, token?: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user, token) =>
        set((state) => ({
          user,
          accessToken: token !== undefined ? (token ?? null) : state.accessToken,
          isAuthenticated: !!user || !!(token !== undefined ? token : state.accessToken),
          isLoading: false,
        })),

      setLoading: (isLoading) => set({ isLoading }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        }),
    }),
    {
      name: "finsight-auth",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // After hydration from localStorage, mark loading as done
        if (state) {
          state.isLoading = false;
        }
      },
    }
  )
);
