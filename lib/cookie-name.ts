// src/lib/cookie-name.ts
// SEC-003 FIX: the auth cookie had no `__Host-` prefix. Browsers enforce, for
// any cookie named with this prefix, that it MUST have Secure set, MUST NOT
// have a Domain attribute, and MUST have Path=/. That combination is exactly
// what prevents a cookie set on a sibling subdomain (or over plain HTTP) from
// being accepted as this cookie — closing a class of subdomain cookie-
// injection attacks that a plain cookie name doesn't protect against.
//
// The prefix can ONLY be used when Secure is actually set (i.e. HTTPS), so we
// only apply it in production; local dev (usually http://localhost) keeps the
// plain name, since browsers silently refuse to set/read a `__Host-` cookie
// over an insecure origin.
//
// No Node/Edge-specific APIs here — safe to import from both
// src/lib/auth.ts (Node runtime) and src/lib/auth-edge.ts (Edge runtime).
export const AUTH_COOKIE_NAME =
  process.env.NODE_ENV === "production" ? "__Host-auth_token" : "auth_token";
