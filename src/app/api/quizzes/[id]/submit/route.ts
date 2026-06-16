// src/app/api/quizzes/[id]/submit/route.ts
// Supports up to 3 attempts per student per quiz
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized } from "@/lib/utils";
import prisma from "@/lib/prisma";

const MAX_ATTEMPTS = 3;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: quizId } = await params;
  const token   = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();

  try {
    const { answers } = await req.json();

    // Count existing attempts
    const existingAttempts = await prisma.quizSubmission.count({
      where: { userId: payload.sub, quizId },
    });

    if (existingAttempts >= MAX_ATTEMPTS) {
      return error(`لقد استنفدت الحد الأقصى من المحاولات (${MAX_ATTEMPTS})`, 403);
    }

    const attemptNumber = existingAttempts + 1;

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

    // Get the lecture's pass score requirement
    const lecture = await prisma.lecture.findUnique({
      where: { id: quiz.lectureId },
      select: { quizPassScore: true },
    });
    const passScore = lecture?.quizPassScore ?? 60;
    const passed    = percentage >= passScore;

    await prisma.quizSubmission.create({
      data: {
        userId: payload.sub,
        quizId,
        attemptNumber,
        score: correct,
        total,
        percentage,
        passed,
        answers,
      },
    });

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
