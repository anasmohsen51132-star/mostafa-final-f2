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

    return Response.json(
      {
        success: true,
        data: {
          totalStudents,
          totalCourses,
          totalLectures,
          totalCodes,
          codesUsed,
          codesAvailable: totalCodes - codesUsed,
        },
      },
      // PERF-001 FIX: 5 COUNT queries ran on every single dashboard load with
      // no caching at all. A short s-maxage lets Vercel's edge cache serve
      // repeat loads within the window without hitting Neon, while
      // stale-while-revalidate keeps it fresh in the background.
      { headers: { "Cache-Control": "private, s-maxage=30, stale-while-revalidate=60" } }
    );
  } catch (e) {
    console.error("[stats]", e);
    return error("حدث خطأ", 500);
  }
}
