// src/lib/auth.ts
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import type { User } from "@/types";
import { AUTH_COOKIE_NAME } from "@/lib/cookie-name";

// BUG-500-001 FIX: this used to validate JWT_SECRET at MODULE LOAD TIME
// (top-level `throw`). Any route that merely imports this file — including
// ones that don't touch auth at all, like GET /api/customize, which only
// imports { extractToken, verifyToken } for its PUT handler — would crash
// with an unhandled exception the instant the module was evaluated, long
// before the route's own try/catch ever ran. That produced an HTTP 500 on
// EVERY route importing this file whenever JWT_SECRET was missing/short,
// not just the ones that actually need to verify a token.
//
// Fix: make the check lazy. The secret is only resolved (and only throws)
// the moment something actually tries to sign or verify a token. Routes
// that don't need auth for a given request path are never affected, and
// routes that catch errors (as every route here does) get a clean 500
// response instead of an unhandled crash.
let cachedSecret: Uint8Array | null = null;
function getSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error(
      "[auth] JWT_SECRET غير معرّف أو ضعيف (أقل من 32 حرف). أضف JWT_SECRET قوي في متغيرات البيئة على Vercel قبل التشغيل."
    );
  }
  cachedSecret = new TextEncoder().encode(process.env.JWT_SECRET);
  return cachedSecret;
}

export interface JWTPayload {
  sub: string;       // user id
  phone: string;
  role: string;
  name: string;
  iat?: number;
  exp?: number;
}

// ---- Sign a new token ----
export async function signToken(payload: Omit<JWTPayload, "iat" | "exp">): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN || "7d")
    .sign(getSecret());
}

// ---- Verify and decode a token ----
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as JWTPayload;
  } catch {
    // Also covers getSecret() throwing (missing/weak JWT_SECRET) — a
    // misconfigured secret should mean "treat this request as unauthenticated",
    // not crash the route with an unhandled 500.
    return null;
  }
}

// ---- Extract token from request (Bearer or cookie) ----
export function extractToken(req: NextRequest): string | null {
  // 1. Authorization header
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  // 2. Cookie
  const cookieToken = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (cookieToken) return cookieToken;
  return null;
}

// ---- Get current user from server component ----
export async function getCurrentUser(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

// ---- Set auth cookie ----
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

// ---- Clear auth cookie ----
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

// ---- Role guards ----
export function isOwner(user: JWTPayload | User | null): boolean {
  return user?.role === "OWNER";
}

export function isAdmin(user: JWTPayload | User | null): boolean {
  return user?.role === "ADMIN" || user?.role === "OWNER";
}

export function isStudent(user: JWTPayload | User | null): boolean {
  return !!user;
}
