// src/app/api/developer/logs/route.ts
//
// Shared listing endpoint behind both Developer Dashboard pages:
//   - Error Center   (/developer/errors)    → typically severity=ERROR,CRITICAL
//   - System Events  (/developer/monitoring) → typically category=SYSTEM
// Both pages just call this with different default query params, so the
// filtering/pagination logic lives in exactly one place.
//
// Already protected by middleware.ts (/api/developer/* is DEVELOPER-only),
// but re-checked here directly too, matching this project's existing
// defense-in-depth convention (see e.g. src/app/api/students/route.ts).
import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden } from "@/lib/utils";
import prisma from "@/lib/prisma";

const VALID_SEVERITIES = ["INFO", "WARNING", "ERROR", "CRITICAL"] as const;
const VALID_CATEGORIES = [
  "ERROR", "EXCEPTION", "API_FAILURE", "AUTH", "SECURITY", "PERFORMANCE",
  "UPLOAD", "VIDEO", "DATABASE", "BACKGROUND_JOB", "SYSTEM",
] as const;

export async function GET(req: NextRequest) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "DEVELOPER") return forbidden();

  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.trim() || "";
    const page  = Math.max(parseInt(url.searchParams.get("page") || "1"), 1);
    // Capped at 100, same ceiling used by src/app/api/students/route.ts, to
    // stop a single request forcing an unbounded full-table read.
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "20"), 1), 100);
    const skip  = (page - 1) * limit;

    const severityParam = url.searchParams.get("severity");
    const categoryParam = url.searchParams.get("category");
    // status: "unresolved" (default) | "resolved" | "all"
    const status = url.searchParams.get("status") || "unresolved";

    const where: Prisma.SystemLogWhereInput = {};

    if (severityParam && (VALID_SEVERITIES as readonly string[]).includes(severityParam)) {
      where.severity = severityParam as (typeof VALID_SEVERITIES)[number];
    }
    if (categoryParam && (VALID_CATEGORIES as readonly string[]).includes(categoryParam)) {
      where.category = categoryParam as (typeof VALID_CATEGORIES)[number];
    }
    if (status === "resolved") where.resolved = true;
    else if (status === "unresolved") where.resolved = false;
    // status === "all" → no filter on `resolved`

    if (search) {
      where.OR = [
        { message: { contains: search, mode: "insensitive" } },
        { route:   { contains: search, mode: "insensitive" } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.systemLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, timestamp: true, severity: true, category: true,
          route: true, method: true, userId: true, role: true, ip: true,
          message: true, resolved: true, resolvedAt: true, createdAt: true,
          // stack/metadata/userAgent are intentionally omitted from the list
          // query (kept for the single-log detail endpoint below) — they
          // can be large and this endpoint may return up to 100 rows.
        },
      }),
      prisma.systemLog.count({ where }),
    ]);

    return success({ logs, total, page, limit });
  } catch (e) {
    console.error("[developer/logs GET]", e);
    return error("حدث خطأ في الخادم", 500);
  }
}
