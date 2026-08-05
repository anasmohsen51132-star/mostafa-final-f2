// src/lib/print-codes.ts
//
// Helpers for the access-code print cards: turning a raw AccessCode (as
// already returned by /api/codes, Prisma include and all) into safe,
// always-renderable display data, paginating onto physical A4 sheets, and
// triggering the print dialog at the right moment.
//
// Deliberately reuses the project's own AccessCode/Course/AcademicLevel
// types instead of introducing a parallel "CardData" shape — the course's
// title and level already live on the models we query everywhere else.

import type { AccessCode } from "@/types";
import { ACADEMIC_LEVEL_LABELS } from "@/types";

export interface PrintCard {
  id: string;
  code: string;
  courseName: string;
  levelLabel: string | null;
  expiresAt?: string | null;
  /** Non-fatal issues found while resolving this card (e.g. a code with no
   *  linked course) — surfaced only in the admin UI, never printed on the
   *  card itself: a missing detail should degrade gracefully, not turn
   *  into a blank or broken card in someone's hands. */
  warnings: string[];
}

/** Physical card + A4 sheet geometry, in millimetres. Screen preview and
 *  print output share these exact numbers, so there's no DPI-dependent
 *  scaling between "what you see" and "what prints" — a real 85mm x 55mm
 *  card (standard PVC/business-card size), 2 columns x 5 rows = exactly
 *  10 per A4 sheet. */
export const CARD_LAYOUT = {
  pageWidthMm: 210,
  pageHeightMm: 297,
  cardWidthMm: 85,
  cardHeightMm: 55,
  columns: 2,
  rows: 5,
  // 2.5mm rather than a rounder 3mm: 5 rows of 55mm cards + 4 gaps must
  // fit inside the printable area (A4 height minus @page margin — see
  // globals.css). At 3mm the math lands on an exact zero-slack fit
  // (287mm content in a 287mm printable area), which is one sub-mm
  // rounding difference in any browser's print engine away from pushing
  // the 5th row onto a second page. 2.5mm leaves a real ~2mm buffer.
  gapMm: 2.5,
} as const;

export const CARDS_PER_PAGE = CARD_LAYOUT.columns * CARD_LAYOUT.rows; // 10

/** Turns one AccessCode into safe, always-renderable card data.
 *  A course with no assigned academic level prints with no level badge —
 *  that's not an error, some courses are deliberately open to every
 *  level (see the course editor's "بدون مرحلة محددة" option). A code
 *  with no linked course at all is flagged in `warnings` instead of
 *  silently printing a blank line. */
export function toPrintCard(code: AccessCode): PrintCard {
  const warnings: string[] = [];
  const primaryCourse = code.courses?.[0]?.course;
  const courseName = code.courses?.map((cc) => cc.course.title).join("، ") || "";
  if (!courseName) warnings.push("courseName: هذا الكود غير مرتبط بأي كورس");

  const levels = primaryCourse?.levels ?? [];
  const levelLabel =
    levels.length === 1 ? ACADEMIC_LEVEL_LABELS[levels[0].academicLevel]
    : levels.length > 1 ? levels.map((l) => ACADEMIC_LEVEL_LABELS[l.academicLevel]).join(" / ")
    : null;

  return { id: code.id, code: code.code, courseName, levelLabel, expiresAt: code.expiresAt, warnings };
}

export function toPrintCards(codes: AccessCode[]): PrintCard[] {
  return codes.map(toPrintCard);
}

/** Splits a flat card list into pages of CARDS_PER_PAGE (10 by default). */
export function chunkIntoPages<T>(items: T[]): T[][] {
  if (items.length === 0) return [[]];
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += CARDS_PER_PAGE) {
    pages.push(items.slice(i, i + CARDS_PER_PAGE));
  }
  return pages;
}

/** Egyptian academic year runs Sept→June: September or later this year =
 *  "this/next"; before September = "last/this". */
export function currentAcademicYear(): string {
  const now = new Date();
  const y = now.getFullYear();
  return now.getMonth() >= 8 ? `${y}/${y + 1}` : `${y - 1}/${y}`;
}

/** Triggers the browser print dialog, giving the browser one extra frame
 *  to finish painting a freshly-mounted print sheet first — printing
 *  immediately after mounting can otherwise miss content on slower
 *  devices/large batches. Also sets the document title for the duration
 *  of the print job, since browsers use it as the default "Save as PDF"
 *  filename. */
export function triggerPrint(title?: string): void {
  const previousTitle = document.title;
  if (title) document.title = title;
  const restore = () => {
    document.title = previousTitle;
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  requestAnimationFrame(() => window.print());
}

export function generatePrintTitle(count: number): string {
  return `أكاديمية مستر مصطفى - ${count} كود`;
}
