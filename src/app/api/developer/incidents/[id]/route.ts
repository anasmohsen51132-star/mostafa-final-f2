// src/app/api/developer/incidents/[id]/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden, notFound } from "@/lib/utils";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateIncidentSchema = z.object({
  status:          z.enum(["OPEN", "INVESTIGATING", "RESOLVED", "CLOSED"]).optional(),
  assignedTo:      z.string().nullable().optional(),
  resolutionNotes: z.string().max(4000).nullable().optional(),
}).strict();

export async function GET(req: NextRequest, { params }: RouteParams) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "DEVELOPER") return forbidden();

  try {
    const { id } = await params;
    const incident = await prisma.incident.findUnique({ where: { id } });
    if (!incident) return notFound("الحادثة غير موجودة");
    return success(incident);
  } catch (e) {
    console.error("[incidents/[id] GET]", e);
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
    const parsed = updateIncidentSchema.safeParse(body);
    if (!parsed.success) return error(parsed.error.errors[0]?.message || "بيانات غير صحيحة");

    const existing = await prisma.incident.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return notFound("الحادثة غير موجودة");

    const incident = await prisma.incident.update({
      where: { id },
      data: parsed.data,
    });

    return success(incident);
  } catch (e) {
    console.error("[incidents/[id] PATCH]", e);
    return error("حدث خطأ في الخادم", 500);
  }
}
