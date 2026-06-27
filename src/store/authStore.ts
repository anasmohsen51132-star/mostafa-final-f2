"use client";
// src/store/authStore.ts
// SEC-007 FIX (prev round): the JWT is never stored here and never touches localStorage.
// SEC-001 FIX (this round): persist() with no `partialize` was writing the FULL user
// object (id, phone, role, isActive...) to localStorage in plaintext. Any XSS on the
// page could read that and use `role` for client-side impersonation decisions, plus it
// leaked the student's phone number. We now persist only a tiny, non-sensitive display
// subset (name + avatar initial) so the UI can paint instantly on refresh; everything
// else (role, phone, id, isActive) is re-fetched fresh from /api/auth/me on mount and
// kept in memory only — never written to disk.
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/types";

interface DisplayUser {
  name: string;
  avatar?: string | null;
}

interface AuthState {
  user: User | null;
  isHydrated: boolean;
  setAuth: (user: User) => void;
  clearAuth: () => void;
  setUser: (user: User) => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isHydrated: false,
      setAuth: (user) => set({ user }),
      clearAuth: () => set({ user: null }),
      setUser: (user) => set({ user }),
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: "mustafa-auth",
      storage: createJSONStorage(() => localStorage),
      // SEC-001 FIX: only these two display fields ever reach localStorage.
      // Cast is intentional: the *stored* shape is deliberately a subset of
      // `User`, while in-memory state is repopulated to the full `User` by
      // SessionSync on mount (see src/components/auth/SessionSync.tsx).
      partialize: (state) =>
        ({
          user: state.user
            ? ({ name: state.user.name, avatar: state.user.avatar } as DisplayUser)
            : null,
        }) as unknown as AuthState,
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
