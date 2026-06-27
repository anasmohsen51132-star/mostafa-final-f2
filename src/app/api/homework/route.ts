// src/app/api/homework/route.ts
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { homeworkSchema } from "@/lib/validations";
import { success, error, unauthorized, forbidden } from "@/lib/utils";
import prisma from "@/lib/prisma";

const MAX_ATTEMPTS = 3;

// POST — create a new homework (admin)
export async function POST(req: NextRequest) {
  const token   = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "OWNER") return forbidden();

  try {
    const body = await req.json();
    const { lectureId } = body;
    if (!lectureId) return error("lectureId مطلوب");

    const parsed = homeworkSchema.safeParse(body);
    if (!parsed.success) return error(parsed.error.errors[0]?.message ?? "بيانات غير صحيحة");

    const { title, questions } = parsed.data;

    const hw = await prisma.homework.create({
      data: {
        lectureId, title,
        questions: {
          create: questions.map((q, qi) => ({
            text: q.text, imageUrl: q.imageUrl, type: q.type, order: q.order ?? qi,
            choices: {
              create: q.choices.map((c, ci) => ({
                text: c.text, imageUrl: c.imageUrl, isCorrect: c.isCorrect, order: c.order ?? ci,
              })),
            },
          })),
        },
      },
      include: {
        questions: { include: { choices: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } },
      },
    });

    return success(hw);
  } catch (e) {
    console.error("[homework POST]", e);
    return error("حدث خطأ في الحفظ", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const token   = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "OWNER") return forbidden();

  try {
    const { id } = await req.json();
    if (!id) return error("id مطلوب");
    await prisma.homework.delete({ where: { id } });
    return success({ deleted: true });
  } catch (e) {
    console.error("[homework DELETE]", e);
    return error("فشل الحذف", 500);
  }
}
