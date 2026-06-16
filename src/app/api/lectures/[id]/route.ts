// src/app/api/lectures/[id]/route.ts
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden, notFound } from "@/lib/utils";
import { lectureSchema } from "@/lib/validations";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();

  try {
    const lecture = await prisma.lecture.findUnique({
      where: { id },
      include: {
        courses: { include: { course: { select: { id: true, title: true, icon: true } } } },
        videos: { orderBy: { order: "asc" } },
        pdfs: { orderBy: { order: "asc" } },
        quizzes: {
          include: {
            questions: {
              include: { choices: { orderBy: { order: "asc" } } },
              orderBy: { order: "asc" },
            },
          },
        },
        homework: {
          include: {
            questions: {
              include: { choices: { orderBy: { order: "asc" } } },
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!lecture) return notFound("المحاضرة غير موجودة");

    // For student: hide isCorrect from choices
    if (payload.role === "STUDENT") {
      const sanitized = {
        ...lecture,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        quizzes: lecture.quizzes.map((q: any) => ({
          ...q,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          questions: q.questions.map((qu: any) => ({
            ...qu,
            choices: qu.choices.map(({ isCorrect: _ic, ...c }: { isCorrect: boolean; [key: string]: unknown }) => c),
          })),
        })),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        homework: lecture.homework.map((hw: any) => ({
          ...hw,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          questions: hw.questions.map((qu: any) => ({
            ...qu,
            choices: qu.choices.map(({ isCorrect: _ic, ...c }: { isCorrect: boolean; [key: string]: unknown }) => c),
          })),
        })),
      };
      return success(sanitized);
    }

    return success(lecture);
  } catch (e) {
    console.error("[lecture GET]", e);
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
    const parsed = lectureSchema.partial().safeParse(body);
    if (!parsed.success) return error(parsed.error.errors[0]?.message || "بيانات غير صحيحة");

    const { courseIds, ...rest } = parsed.data;

    const lecture = await prisma.lecture.update({
      where: { id },
      data: {
        ...rest,
        ...(courseIds && {
          courses: {
            deleteMany: {},
            create: courseIds.map((courseId) => ({ courseId })),
          },
        }),
      },
      include: {
        courses: { include: { course: { select: { id: true, title: true, icon: true } } } },
        _count: { select: { videos: true, pdfs: true, quizzes: true, homework: true } },
      },
    });

    return success(lecture);
  } catch (e) {
    console.error("[lecture PUT]", e);
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
    await prisma.lecture.delete({ where: { id } });
    return success({ deleted: true });
  } catch {
    return error("فشل الحذف", 500);
  }
}
