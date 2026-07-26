// src/app/api/developer/incidents/[id]/analyze/route.ts
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";
import { analyzeIncident, IncidentAnalysisError } from "@/lib/incidents/analyzeIncident";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "DEVELOPER") return forbidden();

  const limited = await rateLimit(`incident-analyze:${payload.sub}`, 20, 60 * 60 * 1000);
  if (!limited.allowed) {
    return error(`محاولات كثيرة جداً — حاول بعد ${Math.ceil(limited.retryAfterMs / 60000)} دقيقة`, 429);
  }

  try {
    const { id } = await params;
    const analysis = await analyzeIncident(id, payload.sub);
    return success(analysis);
  } catch (e) {
    if (e instanceof IncidentAnalysisError) return error(e.message, 422);
    console.error("[incidents/[id]/analyze POST]", e);
    return error("حدث خطأ في الخادم", 500);
  }
}
