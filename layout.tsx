// src/app/api/lectures/[id]/route.ts
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden, notFound } from "@/lib/utils";
import { lectureSchema } from "@/lib/validations";
import { userOwnsLecture } from "@/lib/access";
import { decodeYouTubeId } from "@/lib/utils";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();

  // SEC-001 FIX: students must own an AccessCode unlocking a course that
  // contains this lecture before any content (videos/pdfs/quizzes/homework) is returned.
  const owns = await userOwnsLecture(payload.sub, payload.role, id);
  if (!owns) return forbidden("لا تملك صلاحية الوصول إلى هذه المحاضرة");

  try {
    const lecture = await prisma.lecture.findUnique({
      where: { id },
      include: {
        courses: { include: { course: { select: { id: true, title: true, icon: true } } } },
        videos: { orderBy: { order: "asc" } },
        pdfs: { orderBy: { order: "asc" } },
        // PERF-002 FIX: this used to eagerly include every question and
        // every choice for every quiz/homework attached to the lecture —
        // unbounded payload growth as content was added, most of which the
        // student never opens in a given visit. Only a lightweight count is
        // needed here; full content for whichever single quiz/homework the
        // student actually opens is fetched on demand via the existing
        // ownership-gated GET /api/quizzes/[id] and /api/homework/[id].
        quizzes: {
          select: {
            id: true, title: true, timeLimit: true,
            _count: { select: { questions: true } },
          },
        },
        homework: {
          select: {
            id: true, title: true,
            _count: { select: { questions: true } },
          },
        },
      },
    });

    if (!lecture) return notFound("المحاضرة غير موجودة");

    // API-004 FIX: a student could otherwise still reach an unpublished
    // (draft) lecture directly by ID even though it's hidden from the
    // course listing, as long as they own the course it belongs to.
    if (payload.role === "STUDENT" && !lecture.isPublished) {
      return notFound("المحاضرة غير موجودة");
    }

    // BUG-008 FIX: hasPassed used to be resolved by a *separate* client-side
    // query (GET /api/quizzes/[gateQuizId]/submit) fired only after the
    // lecture itself had already loaded and gateQuizId was derived from it.
    // That waterfall created a one-frame window where the page had
    // `quizRequirement === "MUST_PASS"` but no hasPassed value yet, defaulting
    // to "locked" before flipping open. We now resolve it here, in the exact
    // same request, so the client gets quizRequirement and hasPassed together
    // and never renders an inconsistent in-between state.
    let hasPassed = true;
    if (payload.role === "STUDENT" && lecture.quizRequirement === "MUST_PASS") {
      const gateQuizId = lecture.quizzes[0]?.id;
      hasPassed = gateQuizId
        ? !!(await prisma.quizSubmission.findFirst({
            where: { userId: payload.sub, quizId: gateQuizId, passed: true },
            select: { id: true },
          }))
        : true; // no quiz exists to gate on — don't lock content with nothing to pass
    }

    // For student: hide isCorrect from choices
    if (payload.role === "STUDENT") {
      const sanitized = {
        ...lecture,
        hasPassed,
        // SEC-005 FIX: decode here, server-side, instead of shipping the
        // encoded value to the browser and decoding with a client-bundled
        // key (see utils.ts comment for full context — this obfuscation
        // never provided real protection; the real gate is userOwnsLecture
        // above). The client no longer needs decodeYouTubeId at all.
        videos: lecture.videos.map((v) => ({ ...v, youtubeId: decodeYouTubeId(v.youtubeId) })),
        // SEC-002 FIX: students get our own gated proxy URL, never the raw
        // permanent public blob URL — see /api/pdfs/[id]/view for why.
        pdfs: lecture.pdfs.map((p) => ({ ...p, fileUrl: `/api/pdfs/${p.id}/view` })),
        // No question/choice sanitization needed here anymore — quizzes and
        // homework are now lightweight ({id, title, _count}) per PERF-002.
        // isCorrect stripping happens in /api/quizzes/[id] and
        // /api/homework/[id] when the student actually opens one.
      };
      return success(sanitized);
    }

    return success({ ...lecture, hasPassed });
  } catch (e) {
    console.error("[lecture GET]", e);
    return error("حدث خطأ", 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "OWNER") return forbidden();

  try {
    const body = await req.json();
    const parsed = lectureSchema.partial().safeParse(body);
    if (!parsed.success) return error(parsed.error.errors[0]?.message || "بيانات غير صحيحة");
    // API-003 FIX: .partial() makes every field optional, so an empty body
    // `{}` previously passed validation and triggered a pointless DB write
    // (and an unnecessary cache-invalidating update for nothing).
    if (Object.keys(parsed.data).length === 0) {
      return error("لا توجد بيانات للتحديث");
    }

    const { courseIds, ...rest } = parsed.data;

    const lecture = await prisma.lecture.update({
      where: { id },
      data: {
        ...rest,
        ...(courseIds && {
          courses: {
            deleteMany: {},
            create: courseIds.map((courseId) => ({ courseId })),
          },
        }),
      },
      include: {
        courses: { include: { course: { select: { id: true, title: true, icon: true } } } },
        _count: { select: { videos: true, pdfs: true, quizzes: true, homework: true } },
      },
    });

    return success(lecture);
  } catch (e) {
    console.error("[lecture PUT]", e);
    return error("فشل التحديث", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "OWNER") return forbidden();

  try {
    await prisma.lecture.delete({ where: { id } });
    return success({ deleted: true });
  } catch (e) {
    console.error("[lecture DELETE]", id, e);
    return error("فشل الحذف", 500);
  }
}
