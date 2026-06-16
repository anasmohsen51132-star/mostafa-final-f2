// src/app/api/codes/route.ts
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { codeGenerateSchema } from "@/lib/validations";
import { success, error, unauthorized, forbidden } from "@/lib/utils";
import { generateCodes } from "@/lib/utils";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "OWNER") return forbidden();

  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const [codes, total] = await Promise.all([
      prisma.accessCode.findMany({
        skip,
        take: limit,
        include: {
          courses: { include: { course: { select: { id: true, title: true, icon: true } } } },
          usedBy: { select: { id: true, name: true, phone: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.accessCode.count(),
    ]);

    return success({ codes, total, page, limit });
  } catch (e) {
    console.error("[codes GET]", e);
    return error("حدث خطأ", 500);
  }
}

export async function POST(req: NextRequest) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "OWNER") return forbidden();

  try {
    const body = await req.json();
    const parsed = codeGenerateSchema.safeParse(body);
    if (!parsed.success) return error(parsed.error.errors[0]?.message || "بيانات غير صحيحة");

    const { courseIds, count, expiresAt, note } = parsed.data;

    // Verify courses exist
    const courses = await prisma.course.findMany({ where: { id: { in: courseIds } } });
    if (courses.length !== courseIds.length) return error("بعض الكورسات غير موجودة");

    const codes = generateCodes(count);

    const created = await prisma.$transaction(
      codes.map((code) =>
        prisma.accessCode.create({
          data: {
            code,
            note,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            createdById: payload.sub,
            courses: { create: courseIds.map((courseId) => ({ courseId })) },
          },
          include: {
            courses: { include: { course: { select: { id: true, title: true, icon: true } } } },
          },
        })
      )
    );

    return success({ codes: created, count: created.length });
  } catch (e) {
    console.error("[codes POST]", e);
    return error("حدث خطأ في توليد الكودات", 500);
  }
}
