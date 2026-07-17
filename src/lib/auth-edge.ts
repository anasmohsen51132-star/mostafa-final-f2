// src/lib/auth-edge.ts
// Edge-runtime safe auth helpers — no Node.js APIs, no next/headers
// Used ONLY by middleware.ts
import { jwtVerify } from "jose";
import { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/cookie-name";

// BUG-500-001 FIX (critical): middleware.ts's `matcher` runs this module on
// EVERY request to EVERY path in the app (matcher excludes only
// _next/static, _next/image, favicon.ico — everything else, including "/",
// "/login", and public API routes like /api/customize, goes through
// middleware). A top-level `throw` here meant that if JWT_SECRET was ever
// missing or under 32 chars, the Edge middleware itself crashed before it
// even reached the PUBLIC_PATHS allow-list check — taking down literally
// every route in the entire app with a 500, not just protected ones. This
// is very likely the actual cause of the customize endpoint's 500s: since
// GET/PUT /api/customize both pass through this middleware first, a missing
// JWT_SECRET failed the request before the route handler ever ran.
//
// Fix: resolve the secret lazily, only when a token actually needs
// verifying. Public paths (which return before ever calling
// extractTokenEdge/verifyTokenEdge) are now completely unaffected by
// JWT_SECRET being missing/invalid.
let cachedSecret: Uint8Array | null = null;
function getSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error(
      "[auth-edge] JWT_SECRET غير معرّف أو ضعيف (أقل من 32 حرف). أضف JWT_SECRET قوي في متغيرات البيئة على Vercel قبل التشغيل."
    );
  }
  cachedSecret = new TextEncoder().encode(process.env.JWT_SECRET);
  return cachedSecret;
}

export interface JWTPayload {
  sub: string;
  phone: string;
  role: string;
  name: string;
  iat?: number;
  exp?: number;
}

export async function verifyTokenEdge(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as JWTPayload;
  } catch {
    // Also covers getSecret() throwing (missing/weak JWT_SECRET) — treat
    // as "not authenticated" rather than crashing every request in the app.
    return null;
  }
}

export function extractTokenEdge(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  return req.cookies.get(AUTH_COOKIE_NAME)?.value ?? null;
}
