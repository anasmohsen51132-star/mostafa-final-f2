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
      // SEC-004 FIX (reverts a round-3 mistake): this endpoint requires auth,
      // so its response must never be cached by a SHARED cache (CDN, corporate
      // proxy, Vercel Edge) — a cache doesn't know which caller is allowed to
      // see it, so a `public` response can be replayed to a different,
      // unauthorized requester within the cache window. `private` restricts
      // reuse to the browser's own cache only, which already went through
      // the auth check to get the response in the first place. The data
      // being identical across admins doesn't matter — the endpoint itself
      // isn't, so it can't be `public`.
      { headers: { "Cache-Control": "private, max-age=30" } }
    );
  } catch (e) {
    console.error("[stats]", e);
    return error("حدث خطأ", 500);
  }
}
