// src/app/api/courses/route.ts
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { courseSchema } from "@/lib/validations";
import { success, error, unauthorized, forbidden } from "@/lib/utils";
import prisma from "@/lib/prisma";
import type { AcademicLevel } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const token = extractToken(req);
    const payload = token ? await verifyToken(token) : null;
    const isAdmin = payload && (payload.role === "ADMIN" || payload.role === "OWNER");

    // Build course filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = isAdmin ? {} : { isPublished: true };

    // Level filter: students see courses for their level OR courses with no levels set
    if (payload?.role === "STUDENT") {
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { academicLevel: true },
      });
      if (user?.academicLevel) {
        where.OR = [
          { levels: { some: { academicLevel: user.academicLevel } } },
          { levels: { none: {} } }, // courses with no level restriction = all levels
        ];
      }
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
        _count: { select: { lectures: true } },
        levels: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Determine which courses are unlocked for this student
    let unlockedCourseIds: string[] = [];
    if (payload?.role === "STUDENT") {
      const codes = await prisma.accessCode.findMany({
        where: { usedById: payload.sub },
        include: { courses: { select: { courseId: true } } },
      });
      unlockedCourseIds = codes.flatMap((c: { courses: { courseId: string }[] }) => c.courses.map((cc: { courseId: string }) => cc.courseId));
    }

    const result = courses.map((c: { id: string; [key: string]: unknown }) => ({
      ...c,
      unlocked: isAdmin ? true : unlockedCourseIds.includes(c.id),
    }));

    return success(result);
  } catch (e) {
    console.error("[courses GET]", e);
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
    const parsed = courseSchema.safeParse(body);
    if (!parsed.success) return error(parsed.error.errors[0]?.message || "بيانات غير صحيحة");

    const { levels, ...rest } = parsed.data;

    const course = await prisma.course.create({
      data: {
        ...rest,
        levels: levels?.length
          ? { create: levels.map((l) => ({ academicLevel: l as AcademicLevel })) }
          : undefined,
      },
      include: {
        _count: { select: { lectures: true } },
        levels: true,
      },
    });
    return success(course);
  } catch (e) {
    console.error("[courses POST]", e);
    return error("حدث خطأ في الحفظ", 500);
  }
}
