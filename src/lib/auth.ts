// src/lib/auth.ts
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import type { User } from "@/types";
import { AUTH_COOKIE_NAME } from "@/lib/cookie-name";

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error(
    "[auth] JWT_SECRET غير معرّف أو ضعيف (أقل من 32 حرف). أضف JWT_SECRET قوي في متغيرات البيئة على Vercel قبل التشغيل."
  );
}

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export interface JWTPayload {
  sub: string;       // user id
  phone: string;
  role: string;
  name: string;
  // AUTH-002: single-device login enforcement. Set to a fresh random value
  // on every login; compared against User.currentSessionId in
  // /api/auth/me. A token with a stale `sid` means a newer login happened
  // elsewhere and this session should be treated as logged out.
  sid: string;
  iat?: number;
  exp?: number;
}

// ---- Sign a new token ----
export async function signToken(payload: Omit<JWTPayload, "iat" | "exp">): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    // AUTH-003 ("remember me"): raised from 7d to 60d so a student doesn't
    // have to log back in every week. This is the *ceiling* — the cookie
    // below expires at the same time, and a fresh login (any device)
    // always resets the clock, so an actively-used account effectively
    // never prompts for a re-login; only ~2 months of total inactivity does.
    .setExpirationTime(process.env.JWT_EXPIRES_IN || "60d")
    .sign(SECRET);
}

// ---- Verify and decode a token ----
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as JWTPayload;
  } catch {
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
    maxAge: 60 * 60 * 24 * 60, // AUTH-003: 60 days, matches JWT expiry above
    path: "/",
  });
}

// ---- Clear auth cookie ----
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

// ---- AUTH-002: generate a fresh single-device session id ----
export function generateSessionId(): string {
  return crypto.randomUUID();
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
