// src/app/api/courses/[id]/route.ts
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { courseSchema } from "@/lib/validations";
import { success, error, unauthorized, forbidden, notFound } from "@/lib/utils";
import prisma from "@/lib/prisma";
import type { AcademicLevel } from "@/types";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const token = extractToken(req);
    const payload = token ? await verifyToken(token) : null;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        levels: true,
        lectures: {
          include: {
            lecture: {
              include: {
                _count: { select: { videos: true, pdfs: true, quizzes: true, homework: true } },
              },
            },
          },
          orderBy: { order: "asc" },
        },
        _count: { select: { lectures: true } },
      },
    });

    if (!course) return notFound("الكورس غير موجود");
    if (!payload || payload.role === "STUDENT") {
      if (!course.isPublished) return notFound("الكورس غير موجود");
    }

    return success(course);
  } catch (e) {
    console.error("[course GET]", e);
    return error("حدث خطأ", 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "OWNER") return forbidden();

  try {
    const body = await req.json();
    const parsed = courseSchema.partial().safeParse(body);
    if (!parsed.success) return error(parsed.error.errors[0]?.message || "بيانات غير صحيحة");

    const { levels, ...rest } = parsed.data;

    const course = await prisma.course.update({
      where: { id },
      data: {
        ...rest,
        ...(levels !== undefined && {
          levels: {
            deleteMany: {},
            create: levels.map((l) => ({ academicLevel: l as AcademicLevel })),
          },
        }),
      },
      include: {
        _count: { select: { lectures: true } },
        levels: true,
      },
    });
    return success(course);
  } catch {
    return error("فشل التحديث", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "OWNER") return forbidden();
  try {
    await prisma.course.delete({ where: { id } });
    return success({ deleted: true });
  } catch {
    return error("فشل الحذف", 500);
  }
}
