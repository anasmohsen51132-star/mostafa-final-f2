// src/app/api/lectures/route.ts
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { lectureSchema } from "@/lib/validations";
import { success, error, unauthorized, forbidden } from "@/lib/utils";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "OWNER") return forbidden();

  try {
    const url = new URL(req.url);
    const courseId = url.searchParams.get("courseId");
    const page  = Math.max(parseInt(url.searchParams.get("page")  || "1"), 1);
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "50"), 1), 100);
    const skip  = (page - 1) * limit;

    const where = courseId ? { courses: { some: { courseId } } } : undefined;

    // BUG-003 FIX: this previously returned the entire lectures table with
    // no pagination at all — fine at low volume, but a guaranteed oversized
    // response (and slow admin panel) once lecture count grows.
    const [lectures, total] = await Promise.all([
      prisma.lecture.findMany({
        where,
        skip, take: limit,
        include: {
          courses: {
            include: { course: { select: { id: true, title: true, icon: true } } },
          },
          _count: { select: { videos: true, pdfs: true, quizzes: true, homework: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.lecture.count({ where }),
    ]);

    return success({ lectures, total, page, limit });
  } catch (e) {
    console.error("[lectures GET]", e);
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
    const parsed = lectureSchema.safeParse(body);
    if (!parsed.success) return error(parsed.error.errors[0]?.message || "بيانات غير صحيحة");

    const { courseIds, title, description, order } = parsed.data;

    const lecture = await prisma.lecture.create({
      data: {
        title,
        description,
        order: order ?? 0,
        courses: {
          create: courseIds.map((courseId) => ({ courseId })),
        },
      },
      include: {
        courses: { include: { course: { select: { id: true, title: true, icon: true } } } },
        _count: { select: { videos: true, pdfs: true, quizzes: true, homework: true } },
      },
    });

    return success(lecture);
  } catch (e) {
    console.error("[lectures POST]", e);
    return error("حدث خطأ في الحفظ", 500);
  }
}
