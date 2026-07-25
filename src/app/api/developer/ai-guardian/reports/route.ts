// src/app/api/developer/ai-guardian/reports/route.ts
//
// GET  → report history (History page + hub's "latest report").
// POST → generate a new report RIGHT NOW. Always explicitly triggered by
// a developer clicking a button — never scheduled, never automatic,
// per Task 4's "everything requires explicit human approval" rule.
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import { generateGuardianReport, GuardianGenerationError } from "@/lib/ai-guardian/generateReport";

export async function GET(req: NextRequest) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "DEVELOPER") return forbidden();

  try {
    const url = new URL(req.url);
    const page  = Math.max(parseInt(url.searchParams.get("page") || "1"), 1);
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "20"), 1), 100);

    const [reports, total] = await Promise.all([
      prisma.aiGuardianReport.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, provider: true, model: true, windowHours: true,
          platformScore: true, status: true, summary: true,
          tokensUsed: true, createdAt: true,
        },
      }),
      prisma.aiGuardianReport.count(),
    ]);

    return success({ reports, total, page, limit });
  } catch (e) {
    console.error("[ai-guardian/reports GET]", e);
    return error("حدث خطأ في الخادم", 500);
  }
}

export async function POST(req: NextRequest) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "DEVELOPER") return forbidden();

  // AI provider calls cost real money and take real time — rate-limit
  // generation per developer account regardless of how the button is
  // clicked, reusing the same Postgres-backed limiter as every other
  // rate-limited endpoint in this project.
  const limited = await rateLimit(`ai-guardian-generate:${payload.sub}`, 6, 60 * 60 * 1000);
  if (!limited.allowed) {
    return error(`محاولات كثيرة جداً — أقصى 6 تقارير كل ساعة. حاول بعد ${Math.ceil(limited.retryAfterMs / 60000)} دقيقة`, 429);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const windowHours = typeof body.windowHours === "number" && body.windowHours > 0 && body.windowHours <= 168
      ? Math.floor(body.windowHours)
      : 24;

    const report = await generateGuardianReport({ windowHours, generatedBy: payload.sub });
    return success(report);
  } catch (e) {
    if (e instanceof GuardianGenerationError) return error(e.message, 422);
    console.error("[ai-guardian/reports POST]", e);
    return error("حدث خطأ في الخادم", 500);
  }
}
