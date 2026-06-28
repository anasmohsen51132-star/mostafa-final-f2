// src/app/api/users/staff/route.ts
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden } from "@/lib/utils";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token   = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "OWNER") return forbidden("فقط المالك يمكنه عرض هذه القائمة");

  try {
    const staff = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "OWNER"] } },
      select: {
        id: true, name: true, phone: true, role: true,
        avatar: true, joinedAt: true, isActive: true, academicLevel: true,
      },
      orderBy: { joinedAt: "asc" },
    });
    return success(staff);
  } catch (e) {
    console.error("[staff]", e);
    return error("حدث خطأ", 500);
  }
}
