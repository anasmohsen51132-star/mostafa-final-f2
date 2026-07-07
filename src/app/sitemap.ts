// src/app/sitemap.ts
//
// Next.js App Router convention: automatically served at /sitemap.xml.
//
// SCOPE NOTE (important): per middleware.ts's PUBLIC_PATHS, only "/",
// "/login", and "/register" are reachable without authentication — every
// other route (dashboard, admin, owner, courses, lecture, my-courses,
// profile, redeem) redirects an unauthenticated visitor to /login, so
// there's no actual public content there for a search engine to index.
//
// /login and /register are intentionally NOT listed below even though
// they're publicly reachable: they're set to `robots: { index: false }` in
// their own metadata (see their layout.tsx files), and Google's own
// guidance is explicit that noindex pages should not appear in a sitemap —
// doing so just produces "submitted URL marked noindex" warnings in Search
// Console for no SEO benefit.
//
// This is written to be genuinely dynamic (not a hardcoded static array):
// the homepage's `lastModified` is pulled from the actual SiteSettings row
// that drives its content, so the sitemap's freshness signal changes
// automatically whenever the owner edits the homepage via /owner/customize.
//
// EXTENDING THIS LATER: if a public course catalog / course detail page is
// ever added, this is the place to append one entry per published course,
// e.g.:
//   const courses = await prisma.course.findMany({ where: { isPublished: true } });
//   ...courses.map((c) => ({ url: `${SITE_URL}/courses/${c.id}`, lastModified: c.updatedAt, ... }))
// Do not add such entries while those routes still require login — see the
// matching note in robots.ts about not disallowing something the sitemap
// then lists (Search Console flags this as an error).
import type { MetadataRoute } from "next";
import prisma from "@/lib/prisma";
import { SITE_URL } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let homepageLastModified = new Date();
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "singleton" },
      select: { updatedAt: true },
    });
    if (settings?.updatedAt) homepageLastModified = settings.updatedAt;
  } catch {
    // If the DB is briefly unreachable, fall back to "now" rather than
    // failing the whole sitemap build.
  }

  return [
    {
      url: SITE_URL,
      lastModified: homepageLastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
