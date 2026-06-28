// src/app/api/quizzes/[id]/submit/route.ts
// Supports up to 3 attempts per student per quiz
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden } from "@/lib/utils";
import { userOwnsQuiz } from "@/lib/access";
import { quizAnswersSchema } from "@/lib/validations";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const MAX_ATTEMPTS = 3;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: quizId } = await params;
  const token   = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();

  // SEC-002 FIX: verify the student actually owns the course behind this quiz
  // before accepting any submission.
  const owns = await userOwnsQuiz(payload.sub, payload.role, quizId);
  if (!owns) return forbidden("لا تملك صلاحية الوصول إلى هذا الاختبار");

  try {
    const body = await req.json().catch(() => ({}));
    // BUG-010 FIX: `answers` was used unchecked (answers[question.id]) — an
    // empty/missing/malformed body threw a TypeError that surfaced as an
    // opaque 500 to the student. Now validated as Record<string,string>.
    const parsed = quizAnswersSchema.safeParse(body);
    if (!parsed.success) return error("صيغة الإجابات غير صحيحة");
    const { answers } = parsed.data;

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: { choices: true },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!quiz) return error("الاختبار غير موجود", 404);

    let correct = 0;
    const details: {
      questionId: string;
      correct: boolean;
      selectedChoiceId: string;
      correctChoiceId: string;
    }[] = [];

    for (const question of quiz.questions) {
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

    const total      = quiz.questions.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    const lecture = await prisma.lecture.findUnique({
      where: { id: quiz.lectureId },
      select: { quizPassScore: true },
    });
    const passScore = lecture?.quizPassScore ?? 60;
    const passed    = percentage >= passScore;

    // BUG-002 FIX: count() then create() raced — two parallel requests could both
    // read count=2 and both insert attempt 3, exceeding MAX_ATTEMPTS. We now do the
    // count + create inside one SERIALIZABLE transaction, so a concurrent attempt
    // either serializes safely after this one or is rejected to retry.
    let attemptNumber: number;
    try {
      attemptNumber = await prisma.$transaction(
        async (tx) => {
          const existingAttempts = await tx.quizSubmission.count({
            where: { userId: payload.sub, quizId },
          });
          if (existingAttempts >= MAX_ATTEMPTS) {
            throw new Error("MAX_ATTEMPTS_REACHED");
          }
          const nextAttempt = existingAttempts + 1;
          await tx.quizSubmission.create({
            data: {
              userId: payload.sub,
              quizId,
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
    console.error("[quiz submit]", e);
    return error("حدث خطأ في التسليم", 500);
  }
}

// GET — fetch attempts history for current user
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: quizId } = await params;
  const token   = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();

  const owns = await userOwnsQuiz(payload.sub, payload.role, quizId);
  if (!owns) return forbidden("لا تملك صلاحية الوصول إلى هذا الاختبار");

  try {
    const submissions = await prisma.quizSubmission.findMany({
      where: { userId: payload.sub, quizId },
      orderBy: { attemptNumber: "asc" },
      select: {
        id: true, attemptNumber: true, score: true,
        total: true, percentage: true, passed: true, submittedAt: true,
      },
    });

    return success({
      attempts:         submissions,
      attemptsUsed:     submissions.length,
      attemptsRemaining: Math.max(0, MAX_ATTEMPTS - submissions.length),
      bestScore:        submissions.length > 0
        ? Math.max(...submissions.map((s: { percentage: number }) => s.percentage))
        : null,
      hasPassed: submissions.some((s: { passed: boolean }) => s.passed),
    });
  } catch (e) {
    console.error("[quiz attempts GET]", e);
    return error("حدث خطأ", 500);
  }
}
