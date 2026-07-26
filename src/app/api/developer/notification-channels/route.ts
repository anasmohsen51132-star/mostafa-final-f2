// src/app/api/developer/notification-channels/route.ts
//
// Section 8 (Notification Center) — per the task's explicit "do not send
// notifications yet" instruction, this is storage + CRUD only. No code
// anywhere in this project reads `config` to actually dispatch a message.
import { NextRequest } from "next/server";
import { z } from "zod";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden } from "@/lib/utils";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

const CHANNEL_TYPES = ["EMAIL", "TELEGRAM", "DISCORD", "SLACK", "WEBHOOK"] as const;

const createChannelSchema = z.object({
  type:  z.enum(CHANNEL_TYPES),
  label: z.string().min(1).max(60),
  config: z.record(z.string(), z.unknown()).default({}),
}).strict();

export async function GET(req: NextRequest) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "DEVELOPER") return forbidden();

  try {
    const channels = await prisma.notificationChannel.findMany({ orderBy: { createdAt: "desc" } });
    return success({ channels });
  } catch (e) {
    console.error("[notification-channels GET]", e);
    return error("حدث خطأ في الخادم", 500);
  }
}

export async function POST(req: NextRequest) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "DEVELOPER") return forbidden();

  try {
    const body = await req.json();
    const parsed = createChannelSchema.safeParse(body);
    if (!parsed.success) return error(parsed.error.errors[0]?.message || "بيانات غير صحيحة");

    const channel = await prisma.notificationChannel.create({
      data: {
        ...parsed.data,
        config: parsed.data.config as unknown as Prisma.InputJsonValue,
        createdBy: payload.sub,
      },
    });
    return success(channel);
  } catch (e) {
    console.error("[notification-channels POST]", e);
    return error("حدث خطأ في الخادم", 500);
  }
}
