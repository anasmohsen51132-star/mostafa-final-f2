// src/app/api/developer/incidents/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden } from "@/lib/utils";
import prisma from "@/lib/prisma";
import { syncIncidentsFromLogs } from "@/lib/incidents/syncIncidents";
import { buildFingerprint } from "@/lib/incidents/fingerprint";

const VALID_STATUS = ["OPEN", "INVESTIGATING", "RESOLVED", "CLOSED"] as const;
const VALID_SEVERITY = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

const createIncidentSchema = z.object({
  title:    z.string().min(3).max(200),
  severity: z.enum(VALID_SEVERITY),
  category: z.string().min(1).max(40),
}).strict();

export async function GET(req: NextRequest) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "DEVELOPER") return forbidden();

  try {
    // Read-driven sync (debounced internally) — keeps the list current
    // without any cron job. Never blocks on failure: a sync problem
    // shouldn't stop the developer from seeing already-tracked incidents.
    await syncIncidentsFromLogs().catch((e) => console.error("[incidents sync]", e));

    const url = new URL(req.url);
    const search   = url.searchParams.get("search")?.trim() || "";
    const status   = url.searchParams.get("status");
    const severity = url.searchParams.get("severity");
    const page  = Math.max(parseInt(url.searchParams.get("page") || "1"), 1);
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "20"), 1), 100);

    const where: Record<string, unknown> = {};
    if (status && (VALID_STATUS as readonly string[]).includes(status)) where.status = status;
    if (severity && (VALID_SEVERITY as readonly string[]).includes(severity)) where.severity = severity;
    if (search) where.title = { contains: search, mode: "insensitive" };

    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        where,
        orderBy: { lastDetectedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.incident.count({ where }),
    ]);

    return success({ incidents, total, page, limit });
  } catch (e) {
    console.error("[incidents GET]", e);
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
    const parsed = createIncidentSchema.safeParse(body);
    if (!parsed.success) return error(parsed.error.errors[0]?.message || "بيانات غير صحيحة");

    const fingerprint = `manual:${buildFingerprint(parsed.data.category, parsed.data.title)}:${Date.now()}`;

    const incident = await prisma.incident.create({
      data: {
        title: parsed.data.title,
        severity: parsed.data.severity,
        category: parsed.data.category,
        fingerprint,
        createdBy: payload.sub,
      },
    });

    return success(incident);
  } catch (e) {
    console.error("[incidents POST]", e);
    return error("حدث خطأ في الخادم", 500);
  }
}
