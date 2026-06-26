"use client";
// src/store/authStore.ts
// SEC-007 FIX: the JWT is never stored here and never touches localStorage.
// Auth is enforced exclusively via the httpOnly `auth_token` cookie (see src/lib/auth.ts).
// We only keep a *display* copy of the (non-sensitive) user object so the UI
// can render instantly on refresh; the server remains the source of truth.
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

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
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
