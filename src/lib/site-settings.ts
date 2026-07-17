// src/lib/site-settings.ts
//
// CUSTOM-008: server-only, request-deduped SiteSettings reader. Both
// generateMetadata() and the root layout's render both need the same row;
// without cache(), that's two DB round-trips per request instead of one.
// This is intentionally NOT the same code path as GET /api/customize —
// that route exists for client-side fetches (e.g. re-fetching after the
// owner saves changes without a full page reload); this one is for
// Server Components that already run inside the request lifecycle.
import { cache } from "react";
import prisma from "@/lib/prisma";
import type { SiteSettings } from "@/types";

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  let settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
  if (!settings) {
    settings = await prisma.siteSettings.create({ data: { id: "singleton" } });
  }
  return settings as unknown as SiteSettings;
});
