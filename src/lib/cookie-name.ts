// src/lib/cookie-name.ts
// BUGFIX (logout stuck / stale session survives "logout" in production):
// __Host- is the strictest cookie prefix a browser recognizes — it silently
// DROPS the entire Set-Cookie (no error, no warning, nothing in the Network
// tab beyond the header just not taking effect) unless that exact Set-Cookie
// has Secure, Path=/, and NO Domain attribute. This app has THREE separate
// places that set/clear this cookie (setAuthCookie + clearAuthCookie below,
// and the inline res.cookies.set(...) in middleware.ts for an invalid
// token) — three independent literals that all had to stay byte-for-byte
// aligned on every attribute forever, and any future edit to just one of
// them (e.g. a Domain accidentally added for a custom-domain setup, or one
// call missing Path=/) makes the browser reject that Set-Cookie outright,
// silently. The clear/expire call failing this way is exactly what leaves
// the old session cookie alive after "logging out": the server thinks it
// cleared it, the client never actually removed it, and the next visit to
// "/" is still treated as authenticated.
//
// Two changes fix this class of bug:
// 1. authCookieOptions() below is now the ONE place these attributes are
//    defined — setAuthCookie, clearAuthCookie, and middleware.ts all call
//    it instead of repeating the object, so they can't drift apart again.
// 2. Dropped __Host- down to __Secure-, which only requires Secure (still
//    blocks the cookie from ever being set/read over plain HTTP) but does
//    NOT hard-fail the whole Set-Cookie over Path/Domain specifics the way
//    __Host- does — removing the most likely silent-failure mode while
//    keeping the meaningful security property (HTTPS-only).
//
// SEC-003 (original): the auth cookie previously had no prefix at all,
// which doesn't get any of these browser-enforced guarantees.
//
// The prefix can ONLY be used when Secure is actually set (i.e. HTTPS), so
// we only apply it in production; local dev (usually http://localhost)
// keeps the plain name, since browsers silently refuse to set/read a
// prefixed cookie over an insecure origin.
//
// No Node/Edge-specific APIs here — safe to import from both
// src/lib/auth.ts (Node runtime) and src/lib/auth-edge.ts (Edge runtime).
export const AUTH_COOKIE_NAME =
  process.env.NODE_ENV === "production" ? "__Secure-auth_token" : "auth_token";

export interface AuthCookieOverrides {
  maxAge?: number;
  expires?: Date;
}

// Single source of truth for every attribute except the value itself and
// the overrides above (maxAge when setting, expires when clearing).
export function authCookieOptions(overrides: AuthCookieOverrides = {}) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    ...overrides,
  };
}
