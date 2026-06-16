// src/app/api/stats/route.ts
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden } from "@/lib/utils";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "OWNER") return forbidden();

  try {
    const [
      totalStudents,
      totalCourses,
      totalLectures,
      totalCodes,
      codesUsed,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.course.count(),
      prisma.lecture.count(),
      prisma.accessCode.count(),
      prisma.accessCode.count({ where: { usedById: { not: null } } }),
    ]);

    return success({
      totalStudents,
      totalCourses,
      totalLectures,
      totalCodes,
      codesUsed,
      codesAvailable: totalCodes - codesUsed,
    });
  } catch (e) {
    console.error("[stats]", e);
    return error("حدث خطأ", 500);
  }
}
