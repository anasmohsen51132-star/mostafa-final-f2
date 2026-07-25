// src/app/api/developer/ai-guardian/reports/[id]/route.ts
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden, notFound } from "@/lib/utils";
import prisma from "@/lib/prisma";

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
    const report = await prisma.aiGuardianReport.findUnique({ where: { id } });
    if (!report) return notFound("التقرير غير موجود");
    return success(report);
  } catch (e) {
    console.error("[ai-guardian/reports/[id] GET]", e);
    return error("حدث خطأ في الخادم", 500);
  }
}
