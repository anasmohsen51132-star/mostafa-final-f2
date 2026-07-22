// src/app/api/progress/continue/route.ts
//
// FEATURE-001: "continue where I left off" — powers the dashboard's
// continue-watching card. Returns the single most recently touched,
// not-yet-completed video progress row for the current student, along
// with just enough lecture/course/video info to render a card and link.
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized } from "@/lib/utils";
import prisma from "@/lib/prisma";

// Below this, "continue watching" isn't meaningful yet — someone who
// tapped play and immediately navigated away shouldn't get nagged to
// "continue" a video they never really started.
const MIN_RESUMABLE_SECONDS = 8;

export async function GET(req: NextRequest) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();

  try {
    const progress = await prisma.progress.findFirst({
      where: {
        userId: payload.sub,
        completed: false,
        videoId: { not: null },
        positionSeconds: { gte: MIN_RESUMABLE_SECONDS },
      },
      orderBy: { updatedAt: "desc" },
      select: {
        positionSeconds: true,
        updatedAt: true,
        lecture: {
          select: {
            id: true,
            title: true,
            courses: {
              take: 1,
              select: { course: { select: { id: true, title: true, icon: true, color: true } } },
            },
          },
        },
        video: { select: { id: true, title: true } },
      },
    });

    if (!progress || !progress.video) return success(null);

    return success({
      positionSeconds: progress.positionSeconds ?? 0,
      updatedAt: progress.updatedAt,
      lecture: { id: progress.lecture.id, title: progress.lecture.title },
      video: { id: progress.video.id, title: progress.video.title },
      course: progress.lecture.courses[0]?.course ?? null,
    });
  } catch (e) {
    console.error("[progress/continue GET]", e);
    return error("حدث خطأ", 500);
  }
}
