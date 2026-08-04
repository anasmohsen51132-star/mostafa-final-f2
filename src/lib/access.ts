// src/lib/access.ts
// Centralized ownership verification: AccessCode → CourseOnCode → CourseLecture
// Used by every student-facing endpoint that reads or writes lecture-scoped content.
import prisma from "@/lib/prisma";

// ARCH-002 FIX: userOwnsLecture() runs a multi-table join (AccessCode →
// CourseOnCode → CourseLecture) on every single student request that
// touches lecture-scoped content — including high-frequency ones like a
// video-progress ping firing every few seconds during playback. At scale
// this join runs far more often than it needs to, since ownership rarely
// changes mid-session. We cache the boolean result in a small Postgres
// table (AccessCheckCache — the owner runs Neon rather than Redis/Upstash,
// so this reuses the existing DB instead of adding a new dependency) for a
// short TTL, so most requests hit one indexed row lookup instead of the
// full join. The TTL is short enough that a revoked/expired access code is
// reflected within a minute, not permanently stale.
const CACHE_TTL_MS = 60_000; // 60s — short enough that revocation is felt quickly

async function getCachedOwnership(key: string): Promise<boolean | null> {
  try {
    const row = await prisma.accessCheckCache.findUnique({ where: { key } });
    if (!row) return null;
    if (row.expiresAt.getTime() < Date.now()) return null; // stale, treat as a miss
    return row.owns;
  } catch (e) {
    // Cache read failures should never block a legitimate access check —
    // fall through to the real query instead of erroring out.
    console.error("[access cache read]", e);
    return null;
  }
}

async function setCachedOwnership(key: string, owns: boolean): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + CACHE_TTL_MS);
    await prisma.accessCheckCache.upsert({
      where: { key },
      create: { key, owns, expiresAt },
      update: { owns, expiresAt },
    });
  } catch (e) {
    // A failed cache write just means the next request re-does the real
    // query — never let it fail the request that triggered it.
    console.error("[access cache write]", e);
  }

  // Opportunistic cleanup of long-expired rows, on a small random fraction
  // of writes so it doesn't add latency to every request.
  if (Math.random() < 0.01) {
    prisma.accessCheckCache
      .deleteMany({ where: { expiresAt: { lt: new Date(Date.now() - CACHE_TTL_MS) } } })
      .catch((e) => console.error("[access cache cleanup]", e));
  }
}

/**
 * Returns true if the user has ADMIN/OWNER role (full access) or has redeemed
 * an AccessCode that unlocks a course containing the given lecture.
 */
export async function userOwnsLecture(userId: string, role: string, lectureId: string): Promise<boolean> {
  if (role === "ADMIN" || role === "OWNER" || role === "DEVELOPER") return true;

  const cacheKey = `${userId}:${lectureId}`;
  const cached = await getCachedOwnership(cacheKey);
  if (cached !== null) return cached;

  const owned = await prisma.courseLecture.findFirst({
    where: {
      lectureId,
      course: {
        codes: {
          some: {
            code: { usedById: userId },
          },
        },
      },
    },
    select: { id: true },
  });

  const result = !!owned;
  await setCachedOwnership(cacheKey, result);
  return result;
}

/** Same check, but starting from a quizId (resolves lectureId first). */
export async function userOwnsQuiz(userId: string, role: string, quizId: string): Promise<boolean> {
  if (role === "ADMIN" || role === "OWNER" || role === "DEVELOPER") return true;
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, select: { lectureId: true } });
  if (!quiz) return false;
  return userOwnsLecture(userId, role, quiz.lectureId);
}

/** Same check, but starting from a homeworkId (resolves lectureId first). */
export async function userOwnsHomework(userId: string, role: string, homeworkId: string): Promise<boolean> {
  if (role === "ADMIN" || role === "OWNER" || role === "DEVELOPER") return true;
  const hw = await prisma.homework.findUnique({ where: { id: homeworkId }, select: { lectureId: true } });
  if (!hw) return false;
  return userOwnsLecture(userId, role, hw.lectureId);
}
