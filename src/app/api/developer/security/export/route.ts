// src/app/api/developer/security/export/route.ts
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
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const logs = await prisma.systemLog.findMany({
      where: { createdAt: { gte: since }, category: "SECURITY" },
      orderBy: { createdAt: "desc" },
      take: 2000,
      select: { severity: true, message: true, ip: true, route: true, createdAt: true },
    });

    const csv = buildCsv(
      ["التاريخ", "المستوى", "الرسالة", "IP", "المسار"],
      logs.map((l: { severity: string; message: string; ip: string | null; route: string | null; createdAt: Date }) =>
        [l.createdAt.toISOString(), l.severity, l.message, l.ip ?? "", l.route ?? ""])
    );

    return csvResponse(`security-events-${Date.now()}.csv`, csv);
  } catch (e) {
    console.error("[security/export GET]", e);
    return error("حدث خطأ في الخادم", 500);
  }
}
