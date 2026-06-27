// src/app/api/progress/route.ts
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden } from "@/lib/utils";
import { userOwnsLecture } from "@/lib/access";
import { progressSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import prisma from "@/lib/prisma";

// GET /api/progress?lectureId=xxx
export async function GET(req: NextRequest) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();

  const url = new URL(req.url);
  const lectureId = url.searchParams.get("lectureId");
  if (!lectureId) return error("lectureId مطلوب");

  const owns = await userOwnsLecture(payload.sub, payload.role, lectureId);
  if (!owns) return forbidden("لا تملك صلاحية الوصول إلى هذه المحاضرة");

  try {
    const progress = await prisma.progress.findMany({
      where: {
        userId: payload.sub,
        lectureId,
      },
    });

    return success(progress);
  } catch (e) {
    console.error("[progress GET]", e);
    return error("حدث خطأ", 500);
  }
}

// POST /api/progress
export async function POST(req: NextRequest) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();

  const limited = rateLimit(`progress:${payload.sub}`, 10, 10 * 1000);
  if (!limited.allowed) {
    return error("طلبات كثيرة جداً، انتظر لحظة", 429);
  }

  try {
    const body = await req.json();

    const parsed = progressSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.errors[0]?.message || "بيانات غير صحيحة");
    }

    const { lectureId, videoId, completed } = parsed.data;

    const owns = await userOwnsLecture(payload.sub, payload.role, lectureId);
    if (!owns) {
      return forbidden("لا تملك صلاحية الوصول إلى هذه المحاضرة");
    }

    const existing = await prisma.progress.findFirst({
      where: {
        userId: payload.sub,
        lectureId,
        videoId: videoId ?? null,
      },
    });

    let record;

    if (existing) {
      record = await prisma.progress.update({
        where: {
          id: existing.id,
        },
        data: {
          ...(completed !== undefined ? { completed } : {}),
          watchedAt: new Date(),
        },
      });
    } else {
      record = await prisma.progress.create({
        data: {
          userId: payload.sub,
          lectureId,
          videoId: videoId ?? null,
          completed: completed ?? false,
          watchedAt: new Date(),
        },
      });
    }

    return success(record);
  } catch (e) {
    console.error("[progress POST]", e);
    return error("حدث خطأ", 500);
  }
}
