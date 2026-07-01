// src/app/api/results/route.ts
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden } from "@/lib/utils";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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

    // BUG-005 FIX: the previous `include` chains pulled every scalar column
    // at each nesting level (full quiz row, full lecture row, full course
    // row, full user row) just to read a handful of fields. Explicit
    // `select` trims the join to only the columns actually used below,
    // cutting payload size and DB I/O per row.
    //
    // TS-001 FIX: these `select` shapes are pulled out as named consts so
    // Prisma.{Quiz,Homework}SubmissionGetPayload can derive the exact result
    // type below — no `any` casts, and the type automatically stays correct
    // if the select shape ever changes.
    const quizSelect = {
      id: true, attemptNumber: true, score: true, total: true,
      percentage: true, passed: true, submittedAt: true,
      user: { select: { id: true, name: true, phone: true } },
      quiz: {
        select: {
          title: true, lectureId: true,
          lecture: {
            select: {
              title: true,
              courses: { select: { course: { select: { title: true } } }, take: 1 },
            },
          },
        },
      },
    } satisfies Prisma.QuizSubmissionSelect;

    const homeworkSelect = {
      id: true, attemptNumber: true, score: true, total: true,
      percentage: true, passed: true, submittedAt: true,
      user: { select: { id: true, name: true, phone: true } },
      homework: {
        select: {
          title: true, lectureId: true,
          lecture: {
            select: {
              title: true,
              courses: { select: { course: { select: { title: true } } }, take: 1 },
            },
          },
        },
      },
    } satisfies Prisma.HomeworkSubmissionSelect;

    const [quizSubs, quizTotal, hwSubs, hwTotal] = await Promise.all([
      prisma.quizSubmission.findMany({
        where: quizWhere,
        select: quizSelect,
        orderBy: { submittedAt: "desc" },
        skip, take: limit,
      }),
      prisma.quizSubmission.count({ where: quizWhere }),
      prisma.homeworkSubmission.findMany({
        where: hwWhere,
        select: homeworkSelect,
        orderBy: { submittedAt: "desc" },
        skip, take: limit,
      }),
      prisma.homeworkSubmission.count({ where: hwWhere }),
    ]);

    type QuizSubRow = Prisma.QuizSubmissionGetPayload<{ select: typeof quizSelect }>;
    type HwSubRow   = Prisma.HomeworkSubmissionGetPayload<{ select: typeof homeworkSelect }>;

    // Flatten quiz rows
    const quizRows = quizSubs.map((s: QuizSubRow) => ({
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

    // Flatten homework rows — identical shape to quiz rows now
    const hwRows = hwSubs.map((s: HwSubRow) => ({
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
      score:         s.score,
      total:         s.total,
      percentage:    s.percentage,
      passed:        s.passed,
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
