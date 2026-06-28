// middleware.ts
// Runs in Edge Runtime — only import edge-safe modules
import { NextRequest, NextResponse } from "next/server";
import { verifyTokenEdge, extractTokenEdge } from "@/lib/auth-edge";
import { AUTH_COOKIE_NAME } from "@/lib/cookie-name";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/api/auth/login",
  "/api/auth/register",
  "/api/customize",
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
    "img-src 'self' data: blob: https://img.youtube.com https://i.ytimg.com https://*.public.blob.vercel-storage.com",
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
    return withCsp(NextResponse.redirect(new URL("/login", req.url)), false);
  }

  const payload = await verifyTokenEdge(token);
  if (!payload) {
    if (pathname.startsWith("/api/")) {
      return withCsp(Response.json({ success: false, error: "انتهت الجلسة" }, { status: 401 }), false);
    }
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete(AUTH_COOKIE_NAME);
    return withCsp(res, false);
  }

  // Role-based protection
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (payload.role !== "ADMIN" && payload.role !== "OWNER") {
      if (pathname.startsWith("/api/")) {
        return withCsp(Response.json({ success: false, error: "ليس لديك صلاحية" }, { status: 403 }), false);
      }
      return withCsp(NextResponse.redirect(new URL("/dashboard", req.url)), false);
    }
  }

  if (pathname.startsWith("/owner") || pathname.startsWith("/api/owner")) {
    if (payload.role !== "OWNER") {
      if (pathname.startsWith("/api/")) {
        return withCsp(Response.json({ success: false, error: "ليس لديك صلاحية" }, { status: 403 }), false);
      }
      return withCsp(NextResponse.redirect(new URL("/dashboard", req.url)), false);
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
