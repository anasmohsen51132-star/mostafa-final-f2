// src/app/api/developer/notification-channels/[id]/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden, notFound } from "@/lib/utils";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const patchSchema = z.object({ enabled: z.boolean() }).strict();

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

    const existing = await prisma.notificationChannel.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return notFound("القناة غير موجودة");

    const channel = await prisma.notificationChannel.update({ where: { id }, data: { enabled: parsed.data.enabled } });
    return success(channel);
  } catch (e) {
    console.error("[notification-channels/[id] PATCH]", e);
    return error("حدث خطأ في الخادم", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "DEVELOPER") return forbidden();

  try {
    const { id } = await params;
    const existing = await prisma.notificationChannel.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return notFound("القناة غير موجودة");

    await prisma.notificationChannel.delete({ where: { id } });
    return success({ deleted: true });
  } catch (e) {
    console.error("[notification-channels/[id] DELETE]", e);
    return error("حدث خطأ في الخادم", 500);
  }
}
