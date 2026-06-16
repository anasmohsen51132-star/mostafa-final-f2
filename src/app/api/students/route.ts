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
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
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
            include: {
              courses: { include: { course: { select: { id: true, title: true } } } },
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
