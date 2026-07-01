// src/app/api/homework/[id]/route.ts
// Mirrors src/app/api/quizzes/[id]/route.ts exactly.
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden, notFound } from "@/lib/utils";
import { userOwnsHomework } from "@/lib/access";
import prisma from "@/lib/prisma";

// GET /api/homework/[id] — fetch a single homework with questions
// Students get choices without isCorrect; admins see full data
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token   = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();

  const owns = await userOwnsHomework(payload.sub, payload.role, id);
  if (!owns) return forbidden("لا تملك صلاحية الوصول إلى هذا الواجب");

  try {
    const homework = await prisma.homework.findUnique({
      where: { id },
      include: {
        questions: {
          include: { choices: { orderBy: { order: "asc" } } },
          orderBy: { order: "asc" },
        },
        _count: { select: { submissions: true } },
      },
    });

    if (!homework) return notFound("الواجب غير موجود");

    // Students: strip isCorrect from choices
    if (payload.role === "STUDENT") {
      const sanitized = {
        ...homework,
        questions: homework.questions.map((q) => ({
          ...q,
          choices: q.choices.map(({ isCorrect: _ic, ...c }) => c),
        })),
      };
      return success(sanitized);
    }

    return success(homework);
  } catch (e) {
    console.error("[homework GET]", e);
    return error("حدث خطأ", 500);
  }
}

// DELETE /api/homework/[id] — admin/owner only
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token   = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "OWNER") return forbidden();

  try {
    await prisma.homework.delete({ where: { id } });
    return success({ deleted: true });
  } catch (e) {
    console.error("[homework DELETE]", id, e);
    return error("فشل الحذف", 500);
  }
}
