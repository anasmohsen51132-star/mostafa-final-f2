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
      // SCALE-002 FIX: this data (totalStudents, totalCourses, ...) is
      // identical for every admin who requests it — it was marked `private`,
      // which tells shared/edge caches to ignore `s-maxage` entirely,
      // defeating the caching this header was added for. `public` is correct
      // here since nothing user-specific is in the payload. Note: because
      // this route reads the auth cookie to authorize the request, Next.js
      // treats it as dynamic, so the practical benefit today is mostly
      // browser-level re-use on back/forward nav — full Vercel Edge caching
      // of an authenticated dynamic route depends on platform behavior, but
      // there's no reason to ship the wrong directive regardless.
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
    );
  } catch (e) {
    console.error("[stats]", e);
    return error("حدث خطأ", 500);
  }
}
