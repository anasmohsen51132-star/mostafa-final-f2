// src/app/api/developer/ai-guardian/reports/export/route.ts
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
    const reports = await prisma.aiGuardianReport.findMany({
      orderBy: { createdAt: "desc" },
      take: 1000,
      select: { provider: true, model: true, windowHours: true, platformScore: true, status: true, summary: true, tokensUsed: true, createdAt: true },
    });

    const csv = buildCsv(
      ["التاريخ", "المزود", "الموديل", "نطاق الساعات", "درجة المنصة", "الحالة", "الملخص", "Tokens"],
      reports.map((r: {
        provider: string; model: string; windowHours: number; platformScore: number;
        status: string; summary: string; tokensUsed: number | null; createdAt: Date;
      }) => [
        r.createdAt.toISOString(), r.provider, r.model, r.windowHours, r.platformScore, r.status, r.summary, r.tokensUsed ?? "",
      ])
    );

    return csvResponse(`ai-guardian-reports-${Date.now()}.csv`, csv);
  } catch (e) {
    console.error("[ai-guardian/reports/export GET]", e);
    return error("حدث خطأ في الخادم", 500);
  }
}
