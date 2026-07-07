// src/lib/seo.ts
//
// Central place for SEO constants and JSON-LD (structured data) builders.
// Nothing here touches auth, the database schema, API routes, or any
// existing UI component — it's purely additive metadata/config consumed by
// the new SEO files (robots.ts, sitemap.ts, manifest.ts, layout metadata).
//
// SITE_URL reuses the exact same NEXT_PUBLIC_APP_URL env var already
// required elsewhere in this codebase (see next.config.mjs / middleware.ts)
// for CORS and Server Actions — one source of truth for the canonical
// production origin, not a second, possibly-inconsistent env var.
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

export const SITE_NAME = "أكاديمية مستر مصطفى لتدريس اللغة العربية";
export const SITE_NAME_SHORT = "أكاديمية مستر مصطفى";

export const SITE_DESCRIPTION =
  "منصة تعليم اللغة العربية للثانوية العامة تشمل شرح الدروس والفيديوهات والاختبارات والواجبات وتتبع تقدم الطلاب.";

// Core keyword set for the platform. Individual pages can extend this
// array with a few page-specific terms rather than replacing it outright,
// so the brand/subject terms stay present sitewide.
export const SITE_KEYWORDS = [
  "أكاديمية مستر مصطفى",
  "تعليم اللغة العربية",
  "اللغة العربية للثانوية العامة",
  "دروس لغة عربية أونلاين",
  "شرح نحو وبلاغة",
  "اختبارات لغة عربية",
  "منصة تعليمية عربية",
  "دروس عربي للثانوية",
];

export const DEFAULT_LOCALE = "ar_EG";
export const TWITTER_HANDLE = undefined; // set to e.g. "@mostafa_academy" if/when a Twitter/X account exists

// ── JSON-LD structured data builders ─────────────────────────
// Each function returns a plain object ready for JSON.stringify() inside a
// <script type="application/ld+json"> tag. Keeping these as small pure
// functions (rather than inlining object literals on every page) means the
// same, consistent shape is reused everywhere this data is needed.

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    alternateName: SITE_NAME_SHORT,
    url: SITE_URL,
    logo: `${SITE_URL}/icon`,
    description: SITE_DESCRIPTION,
  };
}

export function educationalOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: SITE_NAME,
    alternateName: SITE_NAME_SHORT,
    url: SITE_URL,
    logo: `${SITE_URL}/icon`,
    description: SITE_DESCRIPTION,
    // "AR" is the ISO 3166-1 country code Schema.org expects here — this is
    // a country code, not a claim about the Arabic language itself.
    areaServed: {
      "@type": "Country",
      name: "Egypt",
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "ar",
    // SearchAction: tells Google this site has an internal search box it can
    // surface as a "Sitelinks Search Box" in results. NOTE: this only takes
    // effect once a real search endpoint exists (e.g. a page that accepts
    // ?q=... and returns results). There isn't one in this codebase today,
    // so this is included per the request ("SearchAction") but is inert
    // until such a page is built — remove this block if you don't intend to
    // add on-site search, since an inaccurate SearchAction can get flagged
    // by Google's structured data checks.
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Minimal BreadcrumbList for a given trail of {name, path} steps.
 * Only the homepage is a genuinely public, indexable page today (see
 * middleware.ts PUBLIC_PATHS), so most call sites will just pass a single
 * "Home" crumb — this is still valid structured data, and the same helper
 * scales automatically if more public pages are added later.
 */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

/**
 * Course structured data — ready to use the moment a public course detail
 * page exists. There isn't one today (course browsing/enrollment is behind
 * login — see middleware.ts PUBLIC_PATHS and the (student) route group), so
 * nothing currently calls this. Wiring it up is a one-line addition to a
 * future public course page: import and call with that course's data.
 */
export function courseJsonLd(course: {
  title: string;
  description?: string | null;
  slug: string; // used to build the course's public URL, e.g. course id/slug
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description ?? SITE_DESCRIPTION,
    provider: {
      "@type": "EducationalOrganization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    url: `${SITE_URL}/courses/${course.slug}`,
    inLanguage: "ar",
  };
}
