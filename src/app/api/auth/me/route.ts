// src/app/api/auth/me/route.ts
import { NextRequest } from "next/server";
import { extractToken, verifyToken, clearAuthCookie } from "@/lib/auth";
import { success, error, unauthorized } from "@/lib/utils";
import { getClientIp } from "@/lib/rate-limit";
import { logWarning } from "@/lib/logger";
import prisma from "@/lib/prisma";

const ROUTE = "/api/auth/me";

// Task 3 (Auth Monitor): logging only happens on the failure branches
// below, never on the normal/valid-session path (hit constantly by
// SessionSync.tsx every 15s), so this doesn't add a DB write to the common
// case. Purely additive observability — no response, status code, or
// control flow changed from before.
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent");

  const token = extractToken(req);
  if (!token) {
    await logWarning("SECURITY", "طلب بدون رمز مصادقة", {
      route: ROUTE, method: "GET", ip, userAgent, metadata: { reason: "no_token" },
    });
    return unauthorized();
  }
  const payload = await verifyToken(token);
  if (!payload) {
    await logWarning("SECURITY", "رمز مصادقة غير صالح أو منتهي", {
      route: ROUTE, method: "GET", ip, userAgent, metadata: { reason: "invalid_token" },
    });
    return unauthorized("انتهت الجلسة، سجل دخولك مجدداً");
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true, name: true, phone: true, role: true,
        academicLevel: true, avatar: true, joinedAt: true, isActive: true,
        currentSessionId: true, lastSeenAt: true,
      },
    });
    if (!user || !user.isActive) {
      await logWarning("SECURITY", "طلب من حساب غير نشط أو غير موجود", {
        route: ROUTE, method: "GET", ip, userAgent, userId: payload.sub, role: payload.role,
        metadata: { reason: "inactive_account" },
      });
      return unauthorized("الحساب غير نشط");
    }

    // AUTH-002: single-device enforcement. This token verified fine
    // cryptographically (it's genuinely this user's token), but if its `sid`
    // doesn't match the account's current session, a newer login happened
    // on a different device since this token was issued — treat this one
    // as logged out. `currentSessionId` can be null for accounts that
    // existed before this feature shipped and haven't logged in since;
    // treat that as "no active session recorded yet" rather than a mismatch,
    // so existing sessions aren't force-logged-out by the deploy itself.
    if (user.currentSessionId && payload.sid !== user.currentSessionId) {
      await logWarning("SECURITY", "جلسة منتهية — تم تسجيل الدخول من جهاز آخر", {
        route: ROUTE, method: "GET", ip, userAgent, userId: payload.sub, role: payload.role,
        metadata: { reason: "session_replaced" },
      });
      await clearAuthCookie();
      return unauthorized("تم تسجيل الدخول من جهاز آخر، تم تسجيل خروجك من هذا الجهاز");
    }

    const { currentSessionId: _sid, lastSeenAt, ...safeUser } = user;

    // Task 3 (Platform Metrics): update "last seen" at most once every 5
    // minutes per user, never on every poll (SessionSync hits this route
    // every 15s) — deliberately NOT awaited, since losing an occasional
    // update here is harmless (the next poll a few minutes later just
    // tries again) and this must never add latency to the hot path this
    // response is already on. .catch() only to avoid an unhandled
    // rejection warning; any failure is silently dropped by design.
    const FIVE_MIN_MS = 5 * 60 * 1000;
    if (!lastSeenAt || Date.now() - lastSeenAt.getTime() > FIVE_MIN_MS) {
      prisma.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } }).catch(() => {});
    }

    // PERF-006 FIX: this response carries the current user's session data —
    // without an explicit no-store, an intermediate shared cache could
    // serve one user's session data to a different user.
    return Response.json(
      { success: true, data: { user: safeUser } },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[me]", e);
    return error("حدث خطأ", 500);
  }
}

export async function DELETE() {
  await clearAuthCookie();
  return success({ message: "تم تسجيل الخروج" });
}
