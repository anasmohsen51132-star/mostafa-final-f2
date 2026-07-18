// src/app/api/owner/customize/delete-image/route.ts
//
// CUSTOM-007: there was previously no way to delete an uploaded settings
// image at all — only ever overwrite the URL text field. That meant no
// actual storage cleanup (orphaned blobs pile up forever) and no way to
// simply "remove" an image (e.g. go back to no hero banner) without pasting
// some other URL in its place. This endpoint does both: deletes the blob
// from Vercel storage and nulls the field on SiteSettings, in one request.
import { NextRequest } from "next/server";
import { del } from "@vercel/blob";
import { revalidateTag } from "next/cache";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden } from "@/lib/utils";
import prisma from "@/lib/prisma";

// Whitelist of settings columns this endpoint is allowed to touch — never
// trust the client-supplied field name directly as a Prisma key, or any
// caller could null out arbitrary columns (e.g. "primaryColor": null would
// crash writes elsewhere expecting a string).
const IMAGE_FIELDS = new Set([
  "heroBackgroundImage",
  "heroIllustration",
  "heroBanner",
  "dashboardBanner",
  "welcomeSectionImage",
  "dashboardDecorImage",
  "headerLogo",
  "loginLogo",
  "faviconImage",
  "ogImage",
]);

export async function POST(req: NextRequest) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "OWNER") return forbidden("فقط المالك يمكنه حذف الصور");

  try {
    const body = await req.json().catch(() => null);
    const field = body?.field as string | undefined;
    const url = body?.url as string | undefined;

    if (!field || !IMAGE_FIELDS.has(field)) return error("حقل غير صحيح");
    if (!url || typeof url !== "string") return error("رابط الصورة غير صحيح");

    // Only actually call Vercel Blob's delete for URLs that are really ours
    // — a pre-existing image set via the old manual-paste-a-URL system
    // (e.g. a Cloudinary link) was never in our storage to begin with, so
    // there's nothing to delete there; just clear the DB field for it.
    // Best-effort either way: if the blob is already gone (deleted twice,
    // or removed manually from storage), don't block clearing the field.
    if (url.includes(".public.blob.vercel-storage.com")) {
      try {
        await del(url);
      } catch (blobErr) {
        console.warn("[owner/customize/delete-image] blob delete failed, continuing:", blobErr);
      }
    }

    const settings = await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton" },
      update: { [field]: null },
    });

    revalidateTag("site-settings");
    return success(settings);
  } catch (e) {
    console.error("[owner/customize/delete-image POST]", e);
    return error("فشل حذف الصورة", 500);
  }
}
