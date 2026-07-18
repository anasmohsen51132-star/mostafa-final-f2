"use client";
// src/components/auth/SessionSync.tsx
// SEC-001 FIX: since authStore.ts now only persists name/avatar to localStorage
// (never role/phone/id/isActive — see partialize in authStore.ts), this component
// re-hydrates the full, authoritative user object from the server on every app
// load via the httpOnly cookie. This also means `role` used for client-side
// routing decisions is always freshly verified server-side, not trusted from disk.
//
// AUTH-002: single-device enforcement is checked here on three triggers —
// initial hydration, a short interval, and tab focus/visibility — so a
// kicked-out session is caught within ~15s of an open tab regardless of
// which trigger fires first. See /api/auth/me for the actual enforcement.
//
// BUGFIX (AUTH-002 v3): the interval/focus listeners used to keep firing
// forever, with no check for whether there was even a logged-in user left.
// The moment a device got logged out by another device's login, this kept
// calling /api/auth/me every ~15s (or more, via focus events) regardless —
// each failed call re-showed a "logged out" toast, so the same device that
// was already logged out kept getting the same notification repeatedly.
// Now: (1) background checks are skipped entirely once there's no user in
// the store, and (2) the toast only fires once per logout event, not once
// per failed check.
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/store/uiStore";

const RECHECK_INTERVAL_MS = 15 * 1000;

export function SessionSync() {
  const { isHydrated, user, setUser, clearAuth, setSessionVerified } = useAuthStore();
  const fired = useRef(false);
  const toast = useToast();

  const liveRef = useRef({ setUser, clearAuth, setSessionVerified, toast });
  liveRef.current = { setUser, clearAuth, setSessionVerified, toast };

  const inFlight = useRef(false);
  // BUGFIX: tracks whether we've already told the user about *this*
  // logout, so a background check that keeps failing (correctly — there's
  // genuinely no session anymore) doesn't keep re-toasting the same event.
  // Reset back to false the moment a check succeeds again (i.e. a real
  // login happened), so a *future* logout can notify normally.
  const notifiedThisLogout = useRef(false);

  const checkSession = (isBackgroundRecheck: boolean) => {
    if (inFlight.current) return;

    // BUGFIX: don't even make the request if there's no logged-in user to
    // begin with — this is what stopped the infinite repeat. Background
    // (interval/focus) triggers only make sense while a session exists;
    // the very first, non-background check on hydration still needs to
    // run once even before we know `user`, which is why this guard only
    // applies to isBackgroundRecheck.
    if (isBackgroundRecheck && !useAuthStore.getState().user) return;

    inFlight.current = true;
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((res) => {
        const { setUser, clearAuth, setSessionVerified, toast } = liveRef.current;
        if (res.success) {
          notifiedThisLogout.current = false;
          setUser(res.data.user);
        } else {
          if (isBackgroundRecheck && !notifiedThisLogout.current) {
            notifiedThisLogout.current = true;
            toast.info(res.error || "انتهت الجلسة");
          }
          clearAuth();
        }
      })
      .catch(() => {
        if (!isBackgroundRecheck) liveRef.current.setSessionVerified();
      })
      .finally(() => {
        inFlight.current = false;
      });
  };

  // Initial check — runs exactly once, after hydration.
  useEffect(() => {
    if (!isHydrated || fired.current) return;
    fired.current = true;

    if (!user) {
      setSessionVerified();
      return;
    }
    checkSession(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated]);

  // Periodic recheck + focus/visibility recheck.
  useEffect(() => {
    const interval = setInterval(() => checkSession(true), RECHECK_INTERVAL_MS);

    const onFocus = () => checkSession(true);
    const onVisible = () => {
      if (document.visibilityState === "visible") checkSession(true);
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
