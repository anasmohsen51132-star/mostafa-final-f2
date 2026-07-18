"use client";
// src/components/auth/SessionSync.tsx
// SEC-001 FIX: since authStore.ts now only persists name/avatar to localStorage
// (never role/phone/id/isActive — see partialize in authStore.ts), this component
// re-hydrates the full, authoritative user object from the server on every app
// load via the httpOnly cookie. This also means `role` used for client-side
// routing decisions is always freshly verified server-side, not trusted from disk.
//
// AUTH-002: also polls /api/auth/me periodically while the app stays open, not
// just once on load. Single-device enforcement happens server-side (see
// /api/auth/me) — this poll just improves how quickly an open, otherwise-idle
// tab notices it's been logged out by a login elsewhere, rather than only
// finding out on its next full reload (which could be hours later).
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/store/uiStore";

const RECHECK_INTERVAL_MS = 5 * 60 * 1000;

export function SessionSync() {
  const { isHydrated, user, setUser, clearAuth, setSessionVerified } = useAuthStore();
  const fired = useRef(false);
  const toast = useToast();

  // BUGFIX: checkSession must NOT be recreated (or re-trigger the effect)
  // every time `user` changes — it changes as a *result* of a successful
  // check, which would tear down and never re-arm the interval after the
  // very first sync. A ref holds the latest store actions/toast without
  // making them reactive dependencies of the interval-setup effect below.
  const liveRef = useRef({ setUser, clearAuth, setSessionVerified, toast });
  liveRef.current = { setUser, clearAuth, setSessionVerified, toast };

  const checkSession = (isBackgroundRecheck: boolean) => {
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((res) => {
        const { setUser, clearAuth, setSessionVerified, toast } = liveRef.current;
        if (res.success) {
          setUser(res.data.user);
        } else {
          // AUTH-002: surface *why* — a silent logout with no explanation
          // reads as a bug ("the site logged me out for no reason") when
          // it's actually expected behavior from logging in elsewhere.
          if (isBackgroundRecheck) toast.info(res.error || "انتهت الجلسة");
          clearAuth();
        }
      })
      .catch(() => {
        // Network hiccup — keep the lightweight display state, don't log
        // the user out, but still unblock layouts waiting on this flag.
        if (!isBackgroundRecheck) liveRef.current.setSessionVerified();
      });
  };

  // Initial check — runs exactly once, after hydration.
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
    checkSession(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated]);

  // Periodic recheck — one interval for the lifetime of the mounted app
  // shell, independent of user/store churn (see liveRef above).
  useEffect(() => {
    const interval = setInterval(() => checkSession(true), RECHECK_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
