// src/app/api/pdfs/[id]/view/route.ts
//
// SEC-002 FIX: PDFs were previously served as the raw, permanent, public
// Vercel Blob URL straight to the student. That URL works forever for
// anyone who has it — sharing the link, or keeping it after an access code
// expires/is revoked, still grants access indefinitely. There is no signed/
// expiring URL feature available on our current Vercel Blob plan, so instead
// we never expose the real blob URL to the client at all: this route fetches
// the PDF server-side and streams the bytes through our own gated endpoint,
// re-checking ownership on every single request. Revoke the access code (or
// let it expire) and the link a student shared stops working immediately,
// because the ownership check — not a guessable/sharable URL — is what
// grants access.
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { unauthorized, forbidden, error } from "@/lib/utils";
import { userOwnsLecture } from "@/lib/access";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token   = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();

  try {
    const pdf = await prisma.pDF.findUnique({
      where: { id },
      select: { id: true, title: true, fileUrl: true, lectureId: true },
    });
    if (!pdf) return error("الملف غير موجود", 404);

    const owns = await userOwnsLecture(payload.sub, payload.role, pdf.lectureId);
    if (!owns) return forbidden("لا تملك صلاحية الوصول إلى هذا الملف");

    const upstream = await fetch(pdf.fileUrl);
    if (!upstream.ok || !upstream.body) {
      console.error("[pdf view] upstream fetch failed", id, upstream.status);
      return error("تعذر تحميل الملف", 502);
    }

    return new Response(upstream.body, {
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "application/pdf",
        "Content-Disposition": `inline; filename="${encodeURIComponent(pdf.title)}.pdf"`,
        // Never cached by shared/CDN caches — every load re-verifies ownership.
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    console.error("[pdf view]", id, e);
    return error("حدث خطأ", 500);
  }
}
