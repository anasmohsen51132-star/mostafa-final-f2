"use client";
// src/components/auth/SessionSync.tsx
// SEC-001 FIX: since authStore.ts now only persists name/avatar to localStorage
// (never role/phone/id/isActive — see partialize in authStore.ts), this component
// re-hydrates the full, authoritative user object from the server on every app
// load via the httpOnly cookie. This also means `role` used for client-side
// routing decisions is always freshly verified server-side, not trusted from disk.
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";

export function SessionSync() {
  const { isHydrated, user, setUser, clearAuth, setSessionVerified } = useAuthStore();
  const fired = useRef(false);

  useEffect(() => {
    if (!isHydrated || fired.current) return;
    fired.current = true;

    // Nothing locally cached at all → no point calling /me, user is logged
    // out. Mark verified immediately so layouts waiting on
    // isSessionVerified don't hang — there's nothing to wait for.
    if (!user) {
      setSessionVerified();
      return;
    }

    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setUser(res.data.user);
        } else {
          clearAuth();
        }
      })
      .catch(() => {
        // Network hiccup — keep the lightweight display state, don't log
        // the user out, but still unblock layouts waiting on this flag.
        setSessionVerified();
      });
  }, [isHydrated, user, setUser, clearAuth, setSessionVerified]);

  return null;
}
