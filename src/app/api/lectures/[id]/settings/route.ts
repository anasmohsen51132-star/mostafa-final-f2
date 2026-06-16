// src/app/api/lectures/[id]/settings/route.ts
// Update quiz requirement setting per lecture
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden } from "@/lib/utils";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token   = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "OWNER") return forbidden();

  try {
    const body = await req.json();
    const { quizRequirement, quizPassScore } = body;

    const allowed = ["NONE", "OPTIONAL", "MUST_PASS"];
    if (quizRequirement && !allowed.includes(quizRequirement)) {
      return error("quizRequirement غير صحيح");
    }

    const lecture = await prisma.lecture.update({
      where: { id },
      data: {
        ...(quizRequirement !== undefined && { quizRequirement }),
        ...(quizPassScore   !== undefined && {
          quizPassScore: Math.max(1, Math.min(100, Number(quizPassScore))),
        }),
      },
      select: { id: true, quizRequirement: true, quizPassScore: true },
    });

    return success(lecture);
  } catch (e) {
    console.error("[lecture settings]", e);
    return error("فشل التحديث", 500);
  }
}
