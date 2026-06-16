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
      },
    });
    if (!user || !user.isActive) return unauthorized("الحساب غير نشط");
    return success({ user });
  } catch (e) {
    console.error("[me]", e);
    return error("حدث خطأ", 500);
  }
}

export async function DELETE() {
  await clearAuthCookie();
  return success({ message: "تم تسجيل الخروج" });
}
