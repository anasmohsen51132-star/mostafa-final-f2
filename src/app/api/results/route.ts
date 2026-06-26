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
  const page      = Math.max(parseInt(url.searchParams.get("page") || "1"), 1);
  const limit     = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "50"), 1), 100);
  const skip      = (page - 1) * limit;

  try {
    const quizWhere = {
      ...(studentId && { userId: studentId }),
      quiz: {
        ...(lectureId && { lectureId }),
        lecture: {
          ...(courseId && {
            courses: { some: { courseId } },
          }),
        },
      },
    };
    const hwWhere = {
      ...(studentId && { userId: studentId }),
      homework: {
        ...(lectureId && { lectureId }),
        lecture: {
          ...(courseId && {
            courses: { some: { courseId } },
          }),
        },
      },
    };

    // BUG-007 FIX: real pagination (page/limit, capped at 100) with total
    // counts returned, instead of a hardcoded take:500 that silently hid
    // records beyond the 500th and risked oversized responses.
    const [quizSubs, quizTotal, hwSubs, hwTotal] = await Promise.all([
      prisma.quizSubmission.findMany({
        where: quizWhere,
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
        skip, take: limit,
      }),
      prisma.quizSubmission.count({ where: quizWhere }),
      prisma.homeworkSubmission.findMany({
        where: hwWhere,
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
        skip, take: limit,
      }),
      prisma.homeworkSubmission.count({ where: hwWhere }),
    ]);

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

    return success({
      quizResults: quizRows,
      homeworkResults: hwRows,
      pagination: { page, limit, quizTotal, hwTotal },
    });
  } catch (e) {
    console.error("[results]", e);
    return error("حدث خطأ", 500);
  }
}
