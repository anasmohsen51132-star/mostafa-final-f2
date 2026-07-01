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

// GET — fetch attempts history for current user (mirrors quiz GET exactly)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: homeworkId } = await params;
  const token   = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();

  const owns = await userOwnsHomework(payload.sub, payload.role, homeworkId);
  if (!owns) return forbidden("لا تملك صلاحية الوصول إلى هذا الواجب");

  try {
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
