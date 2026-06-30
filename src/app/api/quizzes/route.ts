// src/app/api/quizzes/route.ts
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { quizSchema } from "@/lib/validations";
import { success, error, unauthorized, forbidden } from "@/lib/utils";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "OWNER") return forbidden();

  try {
    const body = await req.json();
    const parsed = quizSchema.safeParse(body);
    if (!parsed.success) return error(parsed.error.errors[0]?.message || "بيانات غير صحيحة");

    // SEC-001 / API-001 FIX: lectureId used to be destructured from the raw
    // `body` before validation ran at all — a malformed/oversized value
    // reached Prisma unchecked. It's now part of quizSchema (see
    // validations.ts) and sourced from parsed.data like everything else.
    const { lectureId, title, timeLimit, questions } = parsed.data;

    const quiz = await prisma.quiz.create({
      data: {
        lectureId,
        title,
        timeLimit,
        questions: {
          create: questions.map((q, qi) => ({
            text: q.text,
            imageUrl: q.imageUrl,
            type: q.type,
            order: q.order ?? qi,
            choices: {
              create: q.choices.map((c, ci) => ({
                text: c.text,
                imageUrl: c.imageUrl,
                isCorrect: c.isCorrect,
                order: c.order ?? ci,
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          include: { choices: { orderBy: { order: "asc" } } },
          orderBy: { order: "asc" },
        },
      },
    });

    return success(quiz);
  } catch (e) {
    console.error("[quizzes POST]", e);
    return error("حدث خطأ في الحفظ", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "OWNER") return forbidden();

  try {
    // API-001 FIX: see videos/route.ts DELETE for context.
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return error("id مطلوب");
    await prisma.quiz.delete({ where: { id } });
    return success({ deleted: true });
  } catch (e) {
    console.error("[quizzes DELETE]", e);
    return error("فشل الحذف", 500);
  }
}
