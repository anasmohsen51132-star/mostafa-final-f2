/** @type {import('next').NextConfig} */

// SEC-004 / INFRA-003 (prev round) FIX: lock CORS + Server Actions down to the real
// production origin instead of "*". Set NEXT_PUBLIC_APP_URL on Vercel, e.g.
// https://mostafa-academy.vercel.app (no trailing slash).
//
// INFRA-007 FIX: fail the production build loudly instead of silently falling back
// to localhost (which would break CORS + Server Actions in prod with no obvious error).
if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_APP_URL) {
  throw new Error(
    "[next.config] NEXT_PUBLIC_APP_URL غير معرّف في بيئة production. " +
    "أضف المتغير في Vercel Environment Variables (مثال: https://your-domain.vercel.app) قبل النشر."
  );
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const appOrigin = new URL(appUrl).host;

// SEC-002 FIX: previously only CORS headers existed (for /api/:path* only) — no
// clickjacking/MIME-sniffing/referrer/HSTS protection existed for any HTML page.
//
// NEXT-003 FIX: Content-Security-Policy used to live here as a static header
// with 'unsafe-inline' in script-src, which defeats CSP's main purpose — any
// injected <script> runs exactly as freely as Next's own hydration scripts.
// CSP needs a fresh nonce per request, which a static config file can't
// generate, so it now lives in middleware.ts (see buildCsp there) and is
// applied dynamically alongside the other headers below.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig = {
  experimental: {
    serverActions: { allowedOrigins: [appOrigin] },
  },
  images: {
    // INFRA-004 FIX: `domains` is deprecated in Next.js — use remotePatterns
    remotePatterns: [
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
  // Ensure Buffer is not attempted in browser bundles
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        buffer: false,
        crypto: false,
        stream: false,
        fs: false,
      };
    }
    return config;
  },
  async headers() {
    return [
      {
        // Applies to every route (pages + assets)
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: appUrl },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
          { key: "Access-Control-Allow-Credentials", value: "true" },
        ],
      },
    ];
  },
};

export default nextConfig;
