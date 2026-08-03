// middleware.ts
// Runs in Edge Runtime — only import edge-safe modules
import { NextRequest, NextResponse } from "next/server";
import { verifyTokenEdge, extractTokenEdge } from "@/lib/auth-edge";
import { AUTH_COOKIE_NAME, authCookieOptions } from "@/lib/cookie-name";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/api/auth/login",
  "/api/auth/register",
  "/api/customize",
  // SEO FIX: Next.js's dynamic OG-image file convention (opengraph-image.tsx)
  // serves it at a clean, extension-less path — so the extension-based
  // static-file bypass further down (pathname.includes(".")) never catches
  // it. Without this, every anonymous visitor and every crawler (Google,
  // Facebook/WhatsApp link previews, etc.) would get redirected to /login
  // instead of receiving the actual image, silently breaking social share
  // previews for all of them.
  //
  // NOTE: /icon, /apple-icon, /icon-192, /icon-512 used to need the same
  // explicit entry here too, back when they were also dynamic generators.
  // They're now static .png files (src/app/icon.png, apple-icon.png, and
  // public/icon-192.png, icon-512.png) which already have a "." in their
  // served path, so the generic extension check below covers them — no
  // explicit entry needed anymore.
  "/opengraph-image",
  "/opengraph-image",
];

// SEC-007 FIX: next.config.mjs sets CORS response headers on /api/:path*, but
// Next.js App Router does NOT auto-answer the OPTIONS preflight Vercel
// receives before any real cross-origin request — without this, every
// cross-origin call (mobile app, partner integration) gets a 405 on its
// preflight and never even reaches the real handler.
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
function corsPreflightResponse() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": appUrl,
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}

// NEXT-003 FIX: the static CSP in next.config.mjs had `'unsafe-inline'` in
// script-src, which negates CSP's main XSS protection — any injected
// <script> tag runs just as freely as Next.js's own hydration scripts. A
// nonce is generated fresh per request here (Edge-safe, no Node crypto
// needed) and only script tags carrying it are allowed to execute. Next.js
// automatically applies the nonce from the `x-nonce` request header to its
// own inline scripts when read via headers() in a Server Component (see
// src/app/layout.tsx) — this is their documented pattern, not a workaround.
// `'strict-dynamic'` lets those nonced scripts load further scripts they
// trust, while plain injected <script> tags (no nonce) are blocked outright.
function buildCsp(nonce: string) {
  const isDev = process.env.NODE_ENV !== "production";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // style-src still needs unsafe-inline: Next.js/Tailwind inject style
    // attributes and <style> tags with no nonce support today. This is a
    // far smaller XSS surface than script-src (CSS can't run arbitrary JS).
    "style-src 'self' 'unsafe-inline'",
    // Cloudinary added: the owner uses Cloudinary URLs for images like the
    // dashboard banner (siteSettings.dashboardBanner) — without this, CSP
    // silently blocks the image from loading in the browser. drive.google.com
    // added for the same reason: ImageUploadField now accepts a pasted
    // Google Drive share link and converts it to a drive.google.com/thumbnail
    // URL — this is just a normal image request, not the OAuth Picker flow.
    "img-src 'self' data: blob: https://img.youtube.com https://i.ytimg.com https://*.public.blob.vercel-storage.com https://res.cloudinary.com https://drive.google.com",
    "font-src 'self' data:",
    "frame-src https://www.youtube-nocookie.com",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

function generateNonce(): string {
  // Edge runtime has Web Crypto globally — no Node 'crypto' import needed.
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const nonce = generateNonce();
  const csp   = buildCsp(nonce);

  // Attach nonce + CSP to every response this middleware returns, on every
  // exit path — pages need the CSP header to enforce it, and the nonce
  // header so the root layout can read it via headers().
  function withCsp<T extends Response>(res: T, includeNonceForRequest = true): T {
    res.headers.set("Content-Security-Policy", csp);
    if (includeNonceForRequest) res.headers.set("x-nonce", nonce);
    return res;
  }

  function next(extraRequestHeaders?: Headers) {
    const requestHeaders = extraRequestHeaders ?? new Headers(req.headers);
    requestHeaders.set("x-nonce", nonce);
    return withCsp(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  // BUGFIX (mobile "stuck on /login"): auth-gate redirects (no token, invalid
  // token, wrong role) were returned with no Cache-Control header. Browsers
  // — mobile Safari/Chrome in particular — can cache a 307 redirect per-URL
  // when no explicit no-store directive is present, which meant a device
  // that ever received a redirect for "/" (e.g. from an older deployment)
  // could keep silently replaying that cached redirect forever, never
  // re-asking the server — so it never saw that "/" is public, and clicking
  // back to the homepage hit the same cached redirect again. These auth
  // decisions must always be re-evaluated per request, never cached.
  function redirectNoStore(url: URL) {
    const res = NextResponse.redirect(url);
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  if (req.method === "OPTIONS" && pathname.startsWith("/api/")) {
    return withCsp(corsPreflightResponse(), false);
  }

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith("/api/auth/"))) {
    return next();
  }

  // Allow static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return next();
  }

  const token = extractTokenEdge(req);
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return withCsp(Response.json({ success: false, error: "غير مصرح" }, { status: 401 }), false);
    }
    return withCsp(redirectNoStore(new URL("/login", req.url)), false);
  }

  const payload = await verifyTokenEdge(token);
  if (!payload) {
    if (pathname.startsWith("/api/")) {
      return withCsp(Response.json({ success: false, error: "انتهت الجلسة" }, { status: 401 }), false);
    }
    const res = redirectNoStore(new URL("/login", req.url));
    // BUGFIX (same root cause as clearAuthCookie in src/lib/auth.ts): this used
    // to hand-write these attributes a third time here, separately from
    // setAuthCookie/clearAuthCookie in auth.ts — any drift between the two
    // copies (e.g. a missing Path=/) makes the browser silently reject this
    // Set-Cookie, leaving the invalid/stale cookie in place. Now sourced from
    // the one shared authCookieOptions() (see cookie-name.ts) so all three
    // call sites are always byte-for-byte identical.
    res.cookies.set(AUTH_COOKIE_NAME, "", authCookieOptions({ expires: new Date(0) }));
    return withCsp(res, false);
  }

  // Role-based protection
  // DEVELOPER is the highest permission level and can access everything
  // OWNER/ADMIN can (see /developer block below for its own exclusive area).
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (payload.role !== "ADMIN" && payload.role !== "OWNER" && payload.role !== "DEVELOPER") {
      if (pathname.startsWith("/api/")) {
        return withCsp(Response.json({ success: false, error: "ليس لديك صلاحية" }, { status: 403 }), false);
      }
      return withCsp(redirectNoStore(new URL("/dashboard", req.url)), false);
    }
  }

  if (pathname.startsWith("/owner") || pathname.startsWith("/api/owner")) {
    if (payload.role !== "OWNER" && payload.role !== "DEVELOPER") {
      if (pathname.startsWith("/api/")) {
        return withCsp(Response.json({ success: false, error: "ليس لديك صلاحية" }, { status: 403 }), false);
      }
      return withCsp(redirectNoStore(new URL("/dashboard", req.url)), false);
    }
  }

  // NEW: Developer Dashboard — exclusive to DEVELOPER. Unlike /owner and
  // /admin above, OWNER does NOT get automatic access here: this area is
  // reserved only for the platform developer.
  if (pathname.startsWith("/developer") || pathname.startsWith("/api/developer")) {
    if (payload.role !== "DEVELOPER") {
      if (pathname.startsWith("/api/")) {
        return withCsp(Response.json({ success: false, error: "ليس لديك صلاحية" }, { status: 403 }), false);
      }
      return withCsp(redirectNoStore(new URL("/dashboard", req.url)), false);
    }
  }

  // Inject user context into request headers for API routes
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-id",    payload.sub);
  requestHeaders.set("x-user-role",  payload.role);
  requestHeaders.set("x-user-phone", payload.phone);
  requestHeaders.set("x-user-name",  payload.name);

  return next(requestHeaders);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
