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

    const { lectureId } = body;
    if (!lectureId) return error("lectureId مطلوب");

    const { title, youtubeUrl, duration, order } = parsed.data;

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
    const { id } = await req.json();
    if (!id) return error("id مطلوب");
    await prisma.video.delete({ where: { id } });
    return success({ deleted: true });
  } catch (e) {
    console.error("[videos DELETE]", e);
    return error("فشل الحذف", 500);
  }
}
