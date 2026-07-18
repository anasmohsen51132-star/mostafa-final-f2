// src/app/api/auth/me/route.ts
import { NextRequest } from "next/server";
import { extractToken, verifyToken, clearAuthCookie } from "@/lib/auth";
import { success, error, unauthorized } from "@/lib/utils";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = extractToken(req);
  if (!token) return unauthorized();
  const payload = await verifyToken(token);
  if (!payload) return unauthorized("انتهت الجلسة، سجل دخولك مجدداً");

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true, name: true, phone: true, role: true,
        academicLevel: true, avatar: true, joinedAt: true, isActive: true,
        currentSessionId: true,
      },
    });
    if (!user || !user.isActive) return unauthorized("الحساب غير نشط");

    // AUTH-002: single-device enforcement. This token verified fine
    // cryptographically (it's genuinely this user's token), but if its `sid`
    // doesn't match the account's current session, a newer login happened
    // on a different device since this token was issued — treat this one
    // as logged out. `currentSessionId` can be null for accounts that
    // existed before this feature shipped and haven't logged in since;
    // treat that as "no active session recorded yet" rather than a mismatch,
    // so existing sessions aren't force-logged-out by the deploy itself.
    if (user.currentSessionId && payload.sid !== user.currentSessionId) {
      await clearAuthCookie();
      return unauthorized("تم تسجيل الدخول من جهاز آخر، تم تسجيل خروجك من هذا الجهاز");
    }

    const { currentSessionId: _sid, ...safeUser } = user;
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
