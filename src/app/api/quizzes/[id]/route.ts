// src/app/api/quizzes/[id]/route.ts
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden, notFound } from "@/lib/utils";
import prisma from "@/lib/prisma";

// GET /api/quizzes/[id] — fetch a single quiz with questions
// Students get choices without isCorrect; admins see full data
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token   = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();

  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          include: { choices: { orderBy: { order: "asc" } } },
          orderBy: { order: "asc" },
        },
        _count: { select: { submissions: true } },
      },
    });

    if (!quiz) return notFound("الاختبار غير موجود");

    // Students: strip isCorrect from choices
    if (payload.role === "STUDENT") {
      const sanitized = {
        ...quiz,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        questions: quiz.questions.map((q: any) => ({
          ...q,
          choices: q.choices.map(({ isCorrect: _ic, ...c }: { isCorrect: boolean; [key: string]: unknown }) => c),
        })),
      };
      return success(sanitized);
    }

    return success(quiz);
  } catch (e) {
    console.error("[quiz GET]", e);
    return error("حدث خطأ", 500);
  }
}

// DELETE /api/quizzes/[id] — admin/owner only
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token   = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "OWNER") return forbidden();

  try {
    await prisma.quiz.delete({ where: { id } });
    return success({ deleted: true });
  } catch {
    return error("فشل الحذف", 500);
  }
}
