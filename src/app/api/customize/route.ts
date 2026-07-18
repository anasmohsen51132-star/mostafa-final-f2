// src/app/api/customize/route.ts
//
// GET only, intentionally public (see PUBLIC_PATHS in middleware.ts) —
// the landing page and student dashboard both need to read branding/colors
// without being logged in as OWNER. Mutations moved to
// /api/owner/customize (see CUSTOM-006 note there for why).
//
// BUGFIX: this route has no dynamic API usage (no cookies()/headers()), so
// Next.js's Route Handler static optimization was free to cache its
// response — meaning PUT genuinely updated the DB every time, but this GET
// could keep serving an old cached snapshot from before the save (to every
// visitor, including the student-facing announcement bar) until the next
// deploy rebuilt the cache. `force-dynamic` makes this always hit the DB.
export const dynamic = "force-dynamic";

import { success, error } from "@/lib/utils";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // PERF-003 FIX: GET previously ran an upsert on every single request —
    // a write on every read, with no caching. We now do a plain read first;
    // we only fall back to creating the singleton row the very first time
    // it doesn't exist yet (effectively a one-time write, not a per-request one).
    let settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
    if (!settings) {
      settings = await prisma.siteSettings.create({ data: { id: "singleton" } });
    }
    return success(settings);
  } catch (e) {
    console.error("[customize GET]", e);
    return error("حدث خطأ", 500);
  }
}
