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
  const token   = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();

  const url       = new URL(req.url);
  const lectureId = url.searchParams.get("lectureId");
  if (!lectureId) return error("lectureId مطلوب");

  const owns = await userOwnsLecture(payload.sub, payload.role, lectureId);
  if (!owns) return forbidden("لا تملك صلاحية الوصول إلى هذه المحاضرة");

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

  // SEC-010 FIX: there was no rate limiting at all on this endpoint, so any
  // authenticated student could flood it (e.g. one request per video
  // timeupdate tick) and drive a DB write storm. 1 write/second sustained,
  // bursting to 10, is comfortably enough for legitimate playback tracking.
  const limited = rateLimit(`progress:${payload.sub}`, 10, 10 * 1000);
  if (!limited.allowed) {
    return error("طلبات كثيرة جداً، انتظر لحظة", 429);
  }

  try {
    const body = await req.json();
    // BUG-006 FIX: fields were read straight off req.json() with no type
    // checking — completed:"yes" or videoId:999 would reach the upsert and
    // surface as an unhandled Prisma error. Now validated up front.
    const parsed = progressSchema.safeParse(body);
    if (!parsed.success) return error(parsed.error.errors[0]?.message || "بيانات غير صحيحة");
    const { lectureId, videoId, completed } = parsed.data;

    const owns = await userOwnsLecture(payload.sub, payload.role, lectureId);
    if (!owns) return forbidden("لا تملك صلاحية الوصول إلى هذه المحاضرة");

    // Upsert progress record.
    // NOTE: `videoId` is nullable (lecture-level progress with no specific
    // video). Prisma's generated WhereUniqueInput for the compound
    // @@unique([userId, lectureId, videoId]) requires a non-null videoId —
    // Postgres treats NULL as distinct from every other NULL inside a
    // unique index, so the constraint can't reliably identify "the" row
    // when videoId is null. We branch: a real videoId uses the fast atomic
    // upsert; lecture-level (no videoId) falls back to find-then-write.
    let record;
    if (videoId) {
      record = await prisma.progress.upsert({
        where: {
          userId_lectureId_videoId: { userId: payload.sub, lectureId, videoId },
        },
        create: {
          userId: payload.sub,
          lectureId,
          videoId,
          completed: completed ?? false,
          watchedAt: new Date(),
        },
        update: {
          ...(completed !== undefined && { completed }),
          watchedAt: new Date(),
        },
      });
    } else {
      const existing = await prisma.progress.findFirst({
        where: { userId: payload.sub, lectureId, videoId: null },
      });
      record = existing
        ? await prisma.progress.update({
            where: { id: existing.id },
            data: {
              ...(completed !== undefined && { completed }),
              watchedAt: new Date(),
            },
          })
        : await prisma.progress.create({
            data: {
              userId: payload.sub,
              lectureId,
              videoId: null,
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
