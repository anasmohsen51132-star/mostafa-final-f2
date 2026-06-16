// src/app/api/homework/[id]/submit/route.ts
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized } from "@/lib/utils";
import prisma from "@/lib/prisma";

const MAX_ATTEMPTS = 3;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: homeworkId } = await params;
  const token   = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();

  try {
    const { answers } = await req.json();

    const existing = await prisma.homeworkSubmission.count({
      where: { userId: payload.sub, homeworkId },
    });

    if (existing >= MAX_ATTEMPTS) {
      return error(`لقد استنفدت الحد الأقصى من المحاولات (${MAX_ATTEMPTS})`, 403);
    }

    const attemptNumber = existing + 1;

    const submission = await prisma.homeworkSubmission.create({
      data: {
        userId: payload.sub,
        homeworkId,
        attemptNumber,
        answers: answers ?? {},
      },
      select: {
        id: true, attemptNumber: true, submittedAt: true, grade: true,
      },
    });

    return success({
      ...submission,
      attemptsRemaining: MAX_ATTEMPTS - attemptNumber,
    });
  } catch (e) {
    console.error("[homework submit]", e);
    return error("حدث خطأ في التسليم", 500);
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: homeworkId } = await params;
  const token   = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();

  try {
    const isAdmin = payload.role === "ADMIN" || payload.role === "OWNER";

    const submissions = await prisma.homeworkSubmission.findMany({
      where: isAdmin ? { homeworkId } : { userId: payload.sub, homeworkId },
      include: isAdmin ? { user: { select: { id: true, name: true, phone: true } } } : undefined,
      orderBy: [{ userId: "asc" }, { attemptNumber: "asc" }],
    });

    return success({
      submissions,
      attemptsUsed: isAdmin ? undefined : submissions.length,
      attemptsRemaining: isAdmin ? undefined : Math.max(0, MAX_ATTEMPTS - submissions.length),
    });
  } catch (e) {
    console.error("[homework attempts GET]", e);
    return error("حدث خطأ", 500);
  }
}
