// src/app/api/developer/logs/[id]/route.ts
//
// GET   → full log detail (message, stack trace, metadata, user agent —
//          everything the list endpoint omits for size reasons).
// PATCH → toggle the resolved status, backing the "resolved status" field
//          required by Task 2's schema spec and used by the Error Center's
//          detail page.
import { NextRequest } from "next/server";
import { z } from "zod";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden, notFound } from "@/lib/utils";
import prisma from "@/lib/prisma";

const resolveSchema = z.object({ resolved: z.boolean() }).strict();

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "DEVELOPER") return forbidden();

  try {
    const { id } = await params;
    const log = await prisma.systemLog.findUnique({ where: { id } });
    if (!log) return notFound("السجل غير موجود");
    return success(log);
  } catch (e) {
    console.error("[developer/logs/[id] GET]", e);
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
    const parsed = resolveSchema.safeParse(body);
    if (!parsed.success) return error(parsed.error.errors[0]?.message || "بيانات غير صحيحة");

    const existing = await prisma.systemLog.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return notFound("السجل غير موجود");

    const log = await prisma.systemLog.update({
      where: { id },
      data: {
        resolved:   parsed.data.resolved,
        resolvedAt: parsed.data.resolved ? new Date() : null,
        resolvedBy: parsed.data.resolved ? payload.sub : null,
      },
    });

    return success(log);
  } catch (e) {
    console.error("[developer/logs/[id] PATCH]", e);
    return error("حدث خطأ في الخادم", 500);
  }
}
