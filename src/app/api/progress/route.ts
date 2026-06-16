// src/app/api/progress/route.ts
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized } from "@/lib/utils";
import prisma from "@/lib/prisma";

// GET /api/progress?lectureId=xxx
export async function GET(req: NextRequest) {
  const token   = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();

  const url       = new URL(req.url);
  const lectureId = url.searchParams.get("lectureId");
  if (!lectureId) return error("lectureId مطلوب");

  try {
    const progress = await prisma.progress.findMany({
      where: { userId: payload.sub, lectureId },
    });
    return success(progress);
  } catch (e) {
    console.error("[progress GET]", e);
    return error("حدث خطأ", 500);
  }
}

// POST /api/progress — track video watch / playback events
// Body: { lectureId, videoId?, event?, completed? }
// event: "play" | "pause" | "ended" | "seek" | "completed"
export async function POST(req: NextRequest) {
  const token   = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();

  try {
    const body      = await req.json();
    const { lectureId, videoId, completed } = body;
    if (!lectureId) return error("lectureId مطلوب");

    // Upsert progress record — videoId can be null (lecture-level tracking)
    const record = await prisma.progress.upsert({
      where: {
        userId_lectureId_videoId: {
          userId:    payload.sub,
          lectureId,
          videoId:   videoId ?? null,
        },
      },
      create: {
        userId:    payload.sub,
        lectureId,
        videoId:   videoId ?? null,
        completed: completed ?? false,
        watchedAt: new Date(),
      },
      update: {
        ...(completed !== undefined && { completed }),
        watchedAt: new Date(),
      },
    });

    return success(record);
  } catch (e) {
    console.error("[progress POST]", e);
    return error("حدث خطأ", 500);
  }
}
