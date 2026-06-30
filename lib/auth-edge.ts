// src/lib/auth-edge.ts
// Edge-runtime safe auth helpers — no Node.js APIs, no next/headers
// Used ONLY by middleware.ts
import { jwtVerify } from "jose";
import { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/cookie-name";

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error(
    "[auth-edge] JWT_SECRET غير معرّف أو ضعيف (أقل من 32 حرف). أضف JWT_SECRET قوي في متغيرات البيئة على Vercel قبل التشغيل."
  );
}

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

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
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export function extractTokenEdge(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  return req.cookies.get(AUTH_COOKIE_NAME)?.value ?? null;
}
