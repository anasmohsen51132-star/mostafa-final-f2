// src/app/api/lectures/[id]/route.ts
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden, notFound } from "@/lib/utils";
import { lectureSchema } from "@/lib/validations";
import { userOwnsLecture } from "@/lib/access";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();

  // SEC-001 FIX: students must own an AccessCode unlocking a course that
  // contains this lecture before any content (videos/pdfs/quizzes/homework) is returned.
  const owns = await userOwnsLecture(payload.sub, payload.role, id);
  if (!owns) return forbidden("لا تملك صلاحية الوصول إلى هذه المحاضرة");

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

    // BUG-008 FIX: hasPassed used to be resolved by a *separate* client-side
    // query (GET /api/quizzes/[gateQuizId]/submit) fired only after the
    // lecture itself had already loaded and gateQuizId was derived from it.
    // That waterfall created a one-frame window where the page had
    // `quizRequirement === "MUST_PASS"` but no hasPassed value yet, defaulting
    // to "locked" before flipping open. We now resolve it here, in the exact
    // same request, so the client gets quizRequirement and hasPassed together
    // and never renders an inconsistent in-between state.
    let hasPassed = true;
    if (payload.role === "STUDENT" && lecture.quizRequirement === "MUST_PASS") {
      const gateQuizId = lecture.quizzes[0]?.id;
      hasPassed = gateQuizId
        ? !!(await prisma.quizSubmission.findFirst({
            where: { userId: payload.sub, quizId: gateQuizId, passed: true },
            select: { id: true },
          }))
        : true; // no quiz exists to gate on — don't lock content with nothing to pass
    }

    // For student: hide isCorrect from choices
    if (payload.role === "STUDENT") {
      const sanitized = {
        ...lecture,
        hasPassed,
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

    return success({ ...lecture, hasPassed });
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
  } catch (e) {
    console.error("[lecture DELETE]", id, e);
    return error("فشل الحذف", 500);
  }
}
