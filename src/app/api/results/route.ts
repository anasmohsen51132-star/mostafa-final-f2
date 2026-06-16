// src/app/api/results/route.ts
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden } from "@/lib/utils";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token   = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "OWNER") return forbidden();

  const url       = new URL(req.url);
  const studentId = url.searchParams.get("studentId") ?? undefined;
  const courseId  = url.searchParams.get("courseId")  ?? undefined;
  const lectureId = url.searchParams.get("lectureId") ?? undefined;

  try {
    // Quiz submissions
    const quizSubs = await prisma.quizSubmission.findMany({
      where: {
        ...(studentId && { userId: studentId }),
        quiz: {
          ...(lectureId && { lectureId }),
          lecture: {
            ...(courseId && {
              courses: { some: { courseId } },
            }),
          },
        },
      },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        quiz: {
          include: {
            lecture: {
              include: {
                courses: { include: { course: { select: { id: true, title: true } } }, take: 1 },
              },
            },
          },
        },
      },
      orderBy: { submittedAt: "desc" },
      take: 500,
    });

    // Homework submissions
    const hwSubs = await prisma.homeworkSubmission.findMany({
      where: {
        ...(studentId && { userId: studentId }),
        homework: {
          ...(lectureId && { lectureId }),
          lecture: {
            ...(courseId && {
              courses: { some: { courseId } },
            }),
          },
        },
      },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        homework: {
          include: {
            lecture: {
              include: {
                courses: { include: { course: { select: { id: true, title: true } } }, take: 1 },
              },
            },
          },
        },
      },
      orderBy: { submittedAt: "desc" },
      take: 500,
    });

    // Flatten quiz rows
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quizRows = quizSubs.map((s: any) => ({
      type:          "quiz" as const,
      id:            s.id,
      studentId:     s.user.id,
      studentName:   s.user.name,
      studentPhone:  s.user.phone,
      courseTitle:   s.quiz.lecture.courses[0]?.course.title ?? "—",
      lectureId:     s.quiz.lectureId,
      lectureTitle:  s.quiz.lecture.title,
      quizTitle:     s.quiz.title,
      attemptNumber: s.attemptNumber,
      score:         s.score,
      total:         s.total,
      percentage:    s.percentage,
      passed:        s.passed,
      submittedAt:   s.submittedAt.toISOString(),
    }));

    // Flatten homework rows
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hwRows = hwSubs.map((s: any) => ({
      type:          "homework" as const,
      id:            s.id,
      studentId:     s.user.id,
      studentName:   s.user.name,
      studentPhone:  s.user.phone,
      courseTitle:   s.homework.lecture.courses[0]?.course.title ?? "—",
      lectureId:     s.homework.lectureId,
      lectureTitle:  s.homework.lecture.title,
      homeworkTitle: s.homework.title,
      attemptNumber: s.attemptNumber,
      grade:         s.grade,
      submittedAt:   s.submittedAt.toISOString(),
    }));

    return success({ quizResults: quizRows, homeworkResults: hwRows });
  } catch (e) {
    console.error("[results]", e);
    return error("حدث خطأ", 500);
  }
}
