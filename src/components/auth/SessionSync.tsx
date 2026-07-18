"use client";
// src/components/auth/SessionSync.tsx
// SEC-001 FIX: since authStore.ts now only persists name/avatar to localStorage
// (never role/phone/id/isActive — see partialize in authStore.ts), this component
// re-hydrates the full, authoritative user object from the server on every app
// load via the httpOnly cookie. This also means `role` used for client-side
// routing decisions is always freshly verified server-side, not trusted from disk.
//
// AUTH-002 v2: single-device enforcement is checked here on three triggers,
// not just app load:
//  1. Once on initial hydration (was already there).
//  2. On a short interval (was 5 min — far too slow, an account logged in
//     on two devices could sit "both active" for most of that window; now
//     15s, giving effectively-immediate enforcement for any open tab).
//  3. On tab focus / visibility change — the moment someone switches back
//     to this tab (e.g. after logging in on another device), we recheck
//     right away instead of waiting for the next interval tick. Between
//     (2) and (3), a kicked-out session gets caught within ~15s in every
//     realistic case, without needing WebSockets/SSE for true push-based
//     instant invalidation (a materially bigger change — worth doing later
//     if 15s ever proves not tight enough in practice).
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

  // Avoid overlapping checks if a slow request is still in flight when the
  // next trigger (interval tick or focus event) fires.
  const inFlight = useRef(false);

  // BUG FIX: the "تم تسجيل الدخول من جهاز آخر" toast used to repeat on
  // every single interval tick (every 15s) and every tab focus, forever,
  // instead of showing once. Root cause: the interval/focus effect below
  // has an empty dependency array (`[]`) and sets up its listeners exactly
  // once at mount, so its `checkSession` closure kept referencing the
  // *original* (now stale) `user` from that first render — it was never
  // updated when `clearAuth()` set `user` to null, so every recheck still
  // treated the session as "possibly still valid" and kept polling +
  // re-toasting after the very first kick-out. We now read `user` fresh
  // from the store at call time (via `useAuthStore.getState()`) instead of
  // the closed-over value, and once we've already surfaced the "logged out
  // elsewhere" toast, we stop rechecking entirely until a real user is
  // present again (i.e. they log back in).
  const alreadyNotifiedLogout = useRef(false);

  const checkSession = (isBackgroundRecheck: boolean) => {
    if (inFlight.current) return;

    if (isBackgroundRecheck) {
      const currentUser = useAuthStore.getState().user;
      // Nothing to (re)verify: either we already know we're logged out, or
      // we've already told the user why and are just waiting for them to
      // log in again — either way, hammering the endpoint and re-showing
      // the same toast every 15s / every tab focus serves no purpose.
      if (!currentUser || alreadyNotifiedLogout.current) return;
    }

    inFlight.current = true;
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((res) => {
        const { setUser, clearAuth, setSessionVerified, toast } = liveRef.current;
        if (res.success) {
          // Confirmed a valid session (e.g. they logged back in) — re-arm
          // so a future kick-out can notify again.
          alreadyNotifiedLogout.current = false;
          setUser(res.data.user);
        } else {
          // AUTH-002: surface *why* — a silent logout with no explanation
          // reads as a bug ("the site logged me out for no reason") when
          // it's actually expected behavior from logging in elsewhere.
          // Only shown once per kick-out (see alreadyNotifiedLogout above).
          if (isBackgroundRecheck && !alreadyNotifiedLogout.current) {
            toast.info(res.error || "انتهت الجلسة");
            alreadyNotifiedLogout.current = true;
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

  // Periodic recheck + focus/visibility recheck — one set of listeners for
  // the lifetime of the mounted app shell, independent of user/store churn.
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
