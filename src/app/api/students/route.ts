// src/app/api/students/route.ts
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
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const page = Math.max(parseInt(url.searchParams.get("page") || "1"), 1);
    // SEC-006 FIX: `limit` was parsed with no upper bound — an admin (or a
    // compromised admin session) could request limit=100000 and force a
    // full-table response in one invocation.
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "20"), 1), 100);
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search } },
          ],
          role: "STUDENT" as const,
        }
      : { role: "STUDENT" as const };

    const [students, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true, name: true, phone: true, role: true,
          avatar: true, joinedAt: true, isActive: true,
          redeemedCodes: {
            // PERF-003 FIX: this used to be
            // `include: { redeemedCodes: { include: { courses: { include: { course } } } } }`
            // — a full nested course object for every redeemed code of every
            // student on the page. The admin students list only ever computes
            // a *distinct course count* from this (see
            // src/app/(admin)/admin/students/page.tsx), so we now select just
            // the flat list of courseIds via the join, with nothing nested.
            select: {
              courses: { select: { courseId: true } },
            },
          },
        },
        orderBy: { joinedAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return success({ students, total, page, limit });
  } catch (e) {
    console.error("[students GET]", e);
    return error("حدث خطأ", 500);
  }
}
