// src/app/api/developer/incidents/export/route.ts
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { error, unauthorized, forbidden } from "@/lib/utils";
import prisma from "@/lib/prisma";
import { buildCsv, csvResponse } from "@/lib/exports/csv";

export async function GET(req: NextRequest) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "DEVELOPER") return forbidden();

  try {
    const incidents = await prisma.incident.findMany({ orderBy: { lastDetectedAt: "desc" }, take: 1000 });

    const csv = buildCsv(
      ["العنوان", "الخطورة", "الحالة", "الفئة", "أول ظهور", "آخر ظهور", "عدد التكرار", "السبب الجذري", "الحل المقترح", "ملاحظات الحل"],
      incidents.map((i: {
        title: string; severity: string; status: string; category: string;
        firstDetectedAt: Date; lastDetectedAt: Date; occurrenceCount: number;
        rootCause: string | null; suggestedFix: string | null; resolutionNotes: string | null;
      }) => [
        i.title, i.severity, i.status, i.category,
        i.firstDetectedAt.toISOString(), i.lastDetectedAt.toISOString(), i.occurrenceCount,
        i.rootCause ?? "", i.suggestedFix ?? "", i.resolutionNotes ?? "",
      ])
    );

    return csvResponse(`incidents-${Date.now()}.csv`, csv);
  } catch (e) {
    console.error("[incidents/export GET]", e);
    return error("حدث خطأ في الخادم", 500);
  }
}
