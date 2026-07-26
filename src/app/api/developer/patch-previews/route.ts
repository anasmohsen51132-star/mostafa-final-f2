// src/app/api/developer/patch-previews/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { generatePatchPreview, PatchPreviewError } from "@/lib/incidents/generatePatchPreview";

const generateSchema = z.object({
  incidentId:         z.string().nullable().optional(),
  problemDescription: z.string().min(5).max(2000),
}).strict();

export async function GET(req: NextRequest) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "DEVELOPER") return forbidden();

  try {
    const url = new URL(req.url);
    const incidentId = url.searchParams.get("incidentId");

    const previews = await prisma.patchPreview.findMany({
      where: incidentId ? { incidentId } : {},
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return success({ previews });
  } catch (e) {
    console.error("[patch-previews GET]", e);
    return error("حدث خطأ في الخادم", 500);
  }
}

export async function POST(req: NextRequest) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "DEVELOPER") return forbidden();

  const limited = await rateLimit(`patch-preview-generate:${payload.sub}`, 10, 60 * 60 * 1000);
  if (!limited.allowed) {
    return error(`محاولات كثيرة جداً — حاول بعد ${Math.ceil(limited.retryAfterMs / 60000)} دقيقة`, 429);
  }

  try {
    const body = await req.json();
    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) return error(parsed.error.errors[0]?.message || "بيانات غير صحيحة");

    const preview = await generatePatchPreview({
      incidentId: parsed.data.incidentId,
      problemDescription: parsed.data.problemDescription,
      requestedBy: payload.sub,
    });

    return success(preview);
  } catch (e) {
    if (e instanceof PatchPreviewError) return error(e.message, 422);
    console.error("[patch-previews POST]", e);
    return error("حدث خطأ في الخادم", 500);
  }
}
