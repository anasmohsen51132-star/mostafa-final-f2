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

// SEC-002 FIX: this proxy streamed the entire upstream blob with no size
// limit at all — a single oversized (or malicious) blob could hold a
// concurrent request's memory open indefinitely. We reject upfront based on
// Content-Length when the upstream provides one (cheap, no bytes read), and
// — since that header can be missing or wrong — also enforce the same cap
// while actually streaming, aborting if the real byte count exceeds it.
const MAX_PDF_BYTES = 50 * 1024 * 1024; // 50MB — generous for course PDFs

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

    const declaredLength = Number(upstream.headers.get("content-length") ?? "0");
    if (declaredLength > MAX_PDF_BYTES) {
      console.error("[pdf view] file exceeds size cap", id, declaredLength);
      return error("الملف أكبر من الحد المسموح", 413);
    }

    // Defend against a missing/incorrect Content-Length by counting actual
    // bytes as they stream and aborting if the real size exceeds the cap.
    let streamed = 0;
    const guarded = upstream.body.pipeThrough(
      new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          streamed += chunk.byteLength;
          if (streamed > MAX_PDF_BYTES) {
            controller.error(new Error("PDF_TOO_LARGE"));
            return;
          }
          controller.enqueue(chunk);
        },
      })
    );

    return new Response(guarded, {
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
