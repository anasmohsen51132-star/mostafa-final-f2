// src/app/api/homework/[id]/submit/route.ts
//
// Mirrors src/app/api/quizzes/[id]/submit/route.ts exactly — homework is now
// auto-graded the same way quizzes are (multiple-choice, compared against
// each question's correct choice, same 3-attempt limit). The only
// difference between this file and the quiz one is which model/relation
// names it touches and the Arabic labels in error messages.
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden } from "@/lib/utils";
import { userOwnsHomework } from "@/lib/access";
import { homeworkAnswersSchema } from "@/lib/validations";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const MAX_ATTEMPTS = 3;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: homeworkId } = await params;
  const token   = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();

  const owns = await userOwnsHomework(payload.sub, payload.role, homeworkId);
  if (!owns) return forbidden("لا تملك صلاحية الوصول إلى هذا الواجب");

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = homeworkAnswersSchema.safeParse(body);
    if (!parsed.success) return error(parsed.error.errors[0]?.message || "صيغة الإجابات غير صحيحة");
    const { answers } = parsed.data;

    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      include: {
        questions: {
          include: { choices: true },
          orderBy: { order: "asc" },
        },
        lecture: { select: { quizPassScore: true } },
      },
    });

    if (!homework) return error("الواجب غير موجود", 404);

    let correct = 0;
    const details: {
      questionId: string;
      correct: boolean;
      selectedChoiceId: string;
      correctChoiceId: string;
    }[] = [];

    for (const question of homework.questions) {
      const selectedId   = answers[question.id];
      const correctChoice = question.choices.find((c: { id: string; isCorrect: boolean }) => c.isCorrect);
      const isCorrect     = selectedId === correctChoice?.id;
      if (isCorrect) correct++;
      details.push({
        questionId:       question.id,
        correct:          isCorrect,
        selectedChoiceId: selectedId   || "",
        correctChoiceId:  correctChoice?.id || "",
      });
    }

    const total      = homework.questions.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    // Reuses the lecture's quizPassScore as the pass threshold for homework
    // too — there's no separate "homeworkPassScore" field, since homework
    // and quiz grading are meant to behave identically in this lecture.
    const passScore = homework.lecture?.quizPassScore ?? 60;
    const passed     = percentage >= passScore;

    let attemptNumber: number;
    try {
      attemptNumber = await prisma.$transaction(
        async (tx) => {
          const existingAttempts = await tx.homeworkSubmission.count({
            where: { userId: payload.sub, homeworkId },
          });
          if (existingAttempts >= MAX_ATTEMPTS) {
            throw new Error("MAX_ATTEMPTS_REACHED");
          }
          const nextAttempt = existingAttempts + 1;
          await tx.homeworkSubmission.create({
            data: {
              userId: payload.sub,
              homeworkId,
              attemptNumber: nextAttempt,
              score: correct,
              total,
              percentage,
              passed,
              answers,
            },
          });
          return nextAttempt;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "MAX_ATTEMPTS_REACHED") {
        return error(`لقد استنفدت الحد الأقصى من المحاولات (${MAX_ATTEMPTS})`, 403);
      }
      throw e;
    }

    return success({
      score:             correct,
      total,
      percentage,
      passed,
      attemptNumber,
      attemptsRemaining: MAX_ATTEMPTS - attemptNumber,
      details,
    });
  } catch (e) {
    console.error("[homework submit]", e);
    return error("حدث خطأ في التسليم", 500);
  }
}

// GET — students see their own attempts; admins/owners see every student's
// attempts for this homework (paginated), mirroring the equivalent
// capability quiz submissions have via GET /api/results.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: homeworkId } = await params;
  const token   = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();

  const isAdmin = payload.role === "ADMIN" || payload.role === "OWNER";
  const wantsRoster = isAdmin && new URL(req.url).searchParams.get("view") === "roster";
  if (!isAdmin) {
    const owns = await userOwnsHomework(payload.sub, payload.role, homeworkId);
    if (!owns) return forbidden("لا تملك صلاحية الوصول إلى هذا الواجب");
  }

  try {
    // ARCH-001 FIX: this admin branch existed before homework submission
    // was rewritten to mirror quiz submission exactly, then was silently
    // dropped in that rewrite — admins lost the ability to inspect every
    // student's attempts for a single homework outside the generic
    // /api/results filter view. Restored here, with the same pagination
    // pattern used elsewhere in this codebase (page/limit capped at 100).
    //
    // SAFETY: gated behind ?view=roster rather than role alone — admins/
    // owners can also open the student-facing lecture page to preview a
    // homework (nothing restricts that route by role), where the gate-check
    // logic needs the *personal* {attempts, hasPassed, ...} shape just like
    // a student gets. A plain GET (no ?view=roster) keeps working correctly
    // for that preview case instead of silently getting back an unrelated
    // response shape.
    if (wantsRoster) {
      const url   = new URL(req.url);
      const page  = Math.max(parseInt(url.searchParams.get("page")  || "1"), 1);
      const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "50"), 1), 100);

      const [submissions, total] = await Promise.all([
        prisma.homeworkSubmission.findMany({
          where: { homeworkId },
          include: { user: { select: { id: true, name: true, phone: true } } },
          orderBy: [{ userId: "asc" }, { attemptNumber: "asc" }],
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.homeworkSubmission.count({ where: { homeworkId } }),
      ]);

      return success({ submissions, total, page, limit });
    }

    const submissions = await prisma.homeworkSubmission.findMany({
      where: { userId: payload.sub, homeworkId },
      orderBy: { attemptNumber: "asc" },
      select: {
        id: true, attemptNumber: true, score: true,
        total: true, percentage: true, passed: true, submittedAt: true,
      },
    });

    return success({
      attempts:          submissions,
      attemptsUsed:      submissions.length,
      attemptsRemaining: Math.max(0, MAX_ATTEMPTS - submissions.length),
      bestScore:         submissions.length > 0
        ? Math.max(...submissions.map((s: { percentage: number }) => s.percentage))
        : null,
      hasPassed: submissions.some((s: { passed: boolean }) => s.passed),
    });
  } catch (e) {
    console.error("[homework attempts GET]", e);
    return error("حدث خطأ", 500);
  }
}
