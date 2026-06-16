// src/lib/auth-edge.ts
// Edge-runtime safe auth helpers — no Node.js APIs, no next/headers
// Used ONLY by middleware.ts
import { jwtVerify } from "jose";
import { NextRequest } from "next/server";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-in-production-please"
);

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
  return req.cookies.get("auth_token")?.value ?? null;
}
