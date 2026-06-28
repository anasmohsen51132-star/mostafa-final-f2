// src/app/api/courses/route.ts
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { courseSchema } from "@/lib/validations";
import { success, error, unauthorized, forbidden } from "@/lib/utils";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { AcademicLevel } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const token = extractToken(req);
    const payload = token ? await verifyToken(token) : null;
    const isAdmin = payload && (payload.role === "ADMIN" || payload.role === "OWNER");

    // Build course filter
    const where: Prisma.CourseWhereInput = isAdmin ? {} : { isPublished: true };

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

    // BUG-004 FIX: this had no cap at all. A real academy course catalog is
    // small (tens, not thousands), so we keep the flat-array response shape
    // the frontend already expects, but cap it defensively at 200 so the
    // route can never return an unbounded/oversized payload if the catalog
    // grows far beyond expectations. If the catalog ever needs to exceed
    // this, add real page/limit pagination + matching frontend UI then.
    const COURSE_LIST_CAP = 200;

    const [courses, unlockedRows] = await Promise.all([
      prisma.course.findMany({
        where,
        take: COURSE_LIST_CAP,
        include: {
          _count: { select: { lectures: true } },
          levels: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      // PERF-004 FIX: previously fetched every AccessCode the student owns
      // with a full nested `courses` relation, then flattened it in JS.
      // Querying CourseOnCode directly for `{ courseId }` only does the
      // join at the DB level and returns just the flat list we actually
      // need — no per-code allocations, no nested objects to walk in JS.
      payload?.role === "STUDENT"
        ? prisma.courseOnCode.findMany({
            where: { code: { usedById: payload.sub } },
            select: { courseId: true },
          })
        : Promise.resolve([]),
    ]);

    const unlockedCourseIds = new Set(unlockedRows.map((r: { courseId: string }) => r.courseId));

    const result = courses.map((c: { id: string; [key: string]: unknown }) => ({
      ...c,
      unlocked: isAdmin ? true : unlockedCourseIds.has(c.id),
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
