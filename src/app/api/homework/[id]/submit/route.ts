// src/app/api/homework/[id]/submit/route.ts
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden } from "@/lib/utils";
import { userOwnsHomework } from "@/lib/access";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const MAX_ATTEMPTS = 3;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: homeworkId } = await params;
  const token   = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();

  // SEC-002 FIX: verify ownership before accepting a homework submission.
  const owns = await userOwnsHomework(payload.sub, payload.role, homeworkId);
  if (!owns) return forbidden("لا تملك صلاحية الوصول إلى هذا الواجب");

  try {
    const { answers } = await req.json();

    // BUG-003 FIX: atomic count+create inside a SERIALIZABLE transaction,
    // same race fix as quiz submissions (BUG-002).
    let result;
    try {
      result = await prisma.$transaction(
        async (tx) => {
          const existing = await tx.homeworkSubmission.count({
            where: { userId: payload.sub, homeworkId },
          });
          if (existing >= MAX_ATTEMPTS) {
            throw new Error("MAX_ATTEMPTS_REACHED");
          }
          const attemptNumber = existing + 1;
          const submission = await tx.homeworkSubmission.create({
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
          return { submission, attemptNumber };
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
      ...result.submission,
      attemptsRemaining: MAX_ATTEMPTS - result.attemptNumber,
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

  const isAdmin = payload.role === "ADMIN" || payload.role === "OWNER";
  if (!isAdmin) {
    const owns = await userOwnsHomework(payload.sub, payload.role, homeworkId);
    if (!owns) return forbidden("لا تملك صلاحية الوصول إلى هذا الواجب");
  }

  try {
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
