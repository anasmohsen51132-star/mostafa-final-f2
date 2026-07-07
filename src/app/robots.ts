// src/app/robots.ts
//
// Next.js App Router convention: this file is automatically served at
// /robots.txt (no manual route wiring needed, no static public/robots.txt
// file — MetadataRoute.Robots is the type-checked, production-ready way to
// generate it). Rebuilds automatically on every deploy since SITE_URL comes
// from the same NEXT_PUBLIC_APP_URL env var used elsewhere in the app.
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/register"],
        // Every one of these requires authentication (see middleware.ts
        // PUBLIC_PATHS) — a crawler hitting them unauthenticated is just
        // redirected to /login, so there is nothing indexable behind them
        // and disallowing outright saves crawl budget instead of wasting it
        // on redirect chains. /api/* is disallowed for the same reason plus
        // it's simply not page content.
        disallow: [
          "/dashboard",
          "/admin",
          "/owner",
          "/courses",
          "/my-courses",
          "/lecture",
          "/profile",
          "/redeem",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
