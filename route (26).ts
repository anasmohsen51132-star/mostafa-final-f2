// src/app/api/videos/route.ts
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { videoSchema } from "@/lib/validations";
import { success, error, unauthorized, forbidden } from "@/lib/utils";
import { extractYouTubeId, encodeYouTubeId } from "@/lib/utils";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "OWNER") return forbidden();

  try {
    const body = await req.json();
    const parsed = videoSchema.safeParse(body);
    if (!parsed.success) return error(parsed.error.errors[0]?.message || "بيانات غير صحيحة");

    // API-002 FIX: lectureId was destructured from the raw `body` instead of
    // the validated `parsed.data` — it bypassed zod entirely, so a malformed
    // or oversized lectureId reached Prisma unchecked. `lectureId` is now
    // part of videoSchema (see validations.ts) and sourced from parsed.data.
    const { lectureId, title, youtubeUrl, duration, order } = parsed.data;

    const rawId = extractYouTubeId(youtubeUrl);
    if (!rawId) return error("رابط يوتيوب غير صالح");

    const youtubeId = encodeYouTubeId(rawId);

    const video = await prisma.video.create({
      data: { lectureId, title, youtubeId, duration, order: order ?? 0 },
    });

    return success(video);
  } catch (e) {
    console.error("[videos POST]", e);
    return error("حدث خطأ", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "OWNER") return forbidden();

  try {
    // API-001 FIX: id was read from a DELETE request body — non-standard
    // and silently stripped by some proxies/CDNs (DELETE bodies are widely
    // unsupported in practice). A URL query param works everywhere.
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return error("id مطلوب");
    await prisma.video.delete({ where: { id } });
    return success({ deleted: true });
  } catch (e) {
    console.error("[videos DELETE]", e);
    return error("فشل الحذف", 500);
  }
}
