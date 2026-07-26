// src/app/api/developer/settings/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden } from "@/lib/utils";
import prisma from "@/lib/prisma";

const updateSettingsSchema = z.object({
  theme:                 z.enum(["light", "dark", "system"]).optional(),
  monitoringIntervalSec: z.number().int().min(5).max(300).optional(),
  aiProvider:            z.enum(["claude", "openai", "gemini"]).nullable().optional(),
  incidentRetentionDays: z.number().int().min(7).max(365).optional(),
  dashboardDensity:      z.enum(["comfortable", "compact"]).optional(),
}).strict();

export async function GET(req: NextRequest) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "DEVELOPER") return forbidden();

  try {
    const settings = await prisma.developerSettings.upsert({
      where: { userId: payload.sub },
      update: {},
      create: { userId: payload.sub },
    });
    return success(settings);
  } catch (e) {
    console.error("[developer/settings GET]", e);
    return error("حدث خطأ في الخادم", 500);
  }
}

export async function PUT(req: NextRequest) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "DEVELOPER") return forbidden();

  try {
    const body = await req.json();
    const parsed = updateSettingsSchema.safeParse(body);
    if (!parsed.success) return error(parsed.error.errors[0]?.message || "بيانات غير صحيحة");

    const settings = await prisma.developerSettings.upsert({
      where: { userId: payload.sub },
      update: parsed.data,
      create: { userId: payload.sub, ...parsed.data },
    });

    return success(settings);
  } catch (e) {
    console.error("[developer/settings PUT]", e);
    return error("حدث خطأ في الخادم", 500);
  }
}
