// src/app/api/lectures/[id]/settings/route.ts
// Update quiz requirement setting per lecture
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden } from "@/lib/utils";
import { lectureSettingsSchema } from "@/lib/validations";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token   = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "OWNER") return forbidden();

  try {
    const body = await req.json();
    // SEC-004 / BUG-007 FIX: previously quizPassScore went through a raw
    // Number() cast after only a string-membership check on quizRequirement —
    // Number("abc") = NaN could land in the DB and permanently lock the quiz
    // gate for every student (percentage >= NaN is always false). Now both
    // fields are validated by a strict zod schema before touching the DB.
    const parsed = lectureSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.errors[0]?.message || "بيانات غير صحيحة");
    }
    const { quizRequirement, quizPassScore } = parsed.data;

    const lecture = await prisma.lecture.update({
      where: { id },
      data: {
        ...(quizRequirement !== undefined && { quizRequirement }),
        ...(quizPassScore   !== undefined && { quizPassScore }),
      },
      select: { id: true, quizRequirement: true, quizPassScore: true },
    });

    return success(lecture);
  } catch (e) {
    console.error("[lecture settings PUT]", id, e);
    return error("فشل التحديث", 500);
  }
}
