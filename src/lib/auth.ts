// src/lib/auth.ts
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import type { User } from "@/types";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-in-production-please"
);

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
  const cookieToken = req.cookies.get("auth_token")?.value;
  if (cookieToken) return cookieToken;
  return null;
}

// ---- Get current user from server component ----
export async function getCurrentUser(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

// ---- Set auth cookie ----
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("auth_token", token, {
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
  cookieStore.delete("auth_token");
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
