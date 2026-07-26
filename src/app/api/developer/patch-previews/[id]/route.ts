// src/app/api/developer/patch-previews/[id]/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden, notFound } from "@/lib/utils";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// This ONLY updates a label on the row. It never writes a file, never
// commits, never deploys — see generatePatchPreview.ts's header comment.
const patchSchema = z.object({ approvalStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]) }).strict();

export async function GET(req: NextRequest, { params }: RouteParams) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "DEVELOPER") return forbidden();

  try {
    const { id } = await params;
    const preview = await prisma.patchPreview.findUnique({ where: { id } });
    if (!preview) return notFound("المعاينة غير موجودة");
    return success(preview);
  } catch (e) {
    console.error("[patch-previews/[id] GET]", e);
    return error("حدث خطأ في الخادم", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "DEVELOPER") return forbidden();

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return error(parsed.error.errors[0]?.message || "بيانات غير صحيحة");

    const existing = await prisma.patchPreview.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return notFound("المعاينة غير موجودة");

    const preview = await prisma.patchPreview.update({
      where: { id },
      data: {
        approvalStatus: parsed.data.approvalStatus,
        approvedBy:  parsed.data.approvalStatus === "APPROVED" ? payload.sub : null,
        approvedAt:  parsed.data.approvalStatus === "APPROVED" ? new Date() : null,
      },
    });

    return success(preview);
  } catch (e) {
    console.error("[patch-previews/[id] PATCH]", e);
    return error("حدث خطأ في الخادم", 500);
  }
}
