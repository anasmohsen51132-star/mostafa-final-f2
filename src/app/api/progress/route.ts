// src/app/api/progress/route.ts
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden } from "@/lib/utils";
import { userOwnsLecture } from "@/lib/access";
import { progressSchema } from "@/lib/validations";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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
    return rateLimitResponse("طلبات كثيرة جداً، انتظر لحظة", limited.retryAfterMs);
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
    // when videoId is null. A real videoId uses the fast atomic upsert.
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
      // PERF-004 FIX: a plain findFirst → create/update here let two
      // concurrent requests (e.g. two rapid-fire "mark lecture complete"
      // clicks) both pass the findFirst before either had written anything,
      // so both proceeded to create() — leaving two Progress rows for the
      // same (user, lecture, no-video) pair instead of one. Wrapped in a
      // Serializable transaction (same pattern as quiz/homework attempt
      // counting elsewhere in this codebase): Postgres aborts the losing
      // transaction with a serialization conflict instead of letting both
      // commit, and we retry it once — the retry's findFirst then correctly
      // sees the row the winner just created.
      const writeNullVideoProgress = () =>
        prisma.$transaction(
          async (tx) => {
            const existing = await tx.progress.findFirst({
              where: { userId: payload.sub, lectureId, videoId: null },
            });
            return existing
              ? tx.progress.update({
                  where: { id: existing.id },
                  data: {
                    ...(completed !== undefined && { completed }),
                    watchedAt: new Date(),
                  },
                })
              : tx.progress.create({
                  data: {
                    userId: payload.sub,
                    lectureId,
                    videoId: null,
                    completed: completed ?? false,
                    watchedAt: new Date(),
                  },
                });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
        );

      try {
        record = await writeNullVideoProgress();
      } catch (e: unknown) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2034") {
          record = await writeNullVideoProgress();
        } else {
          throw e;
        }
      }
    }

    return success(record);
  } catch (e) {
    console.error("[progress POST]", e);
    return error("حدث خطأ", 500);
  }
}
