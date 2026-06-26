// src/app/api/pdfs/route.ts
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden } from "@/lib/utils";
import prisma from "@/lib/prisma";

// BUG-011 FIX: fileUrl was stored with no validation at all, letting an admin
// account (or a compromised admin session) store javascript:/data: URLs or
// links to arbitrary untrusted hosts that get served to every student.
// We now require https:// and restrict to Vercel Blob's own storage domain
// (set BLOB_PUBLIC_HOSTNAME if your blob store uses a custom domain).
function isAllowedFileUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;

  const allowedHosts = [
    "public.blob.vercel-storage.com",
    process.env.BLOB_PUBLIC_HOSTNAME,
  ].filter(Boolean) as string[];

  return allowedHosts.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`));
}

export async function POST(req: NextRequest) {
  const token   = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "OWNER") return forbidden();

  try {
    const { lectureId, title, fileUrl, order } = await req.json();
    if (!lectureId || !title || !fileUrl) return error("lectureId و title و fileUrl مطلوبة");
    if (!isAllowedFileUrl(fileUrl)) {
      return error("رابط الملف غير صحيح، يجب أن يكون رابط HTTPS من مساحة التخزين الموثوقة");
    }

    const pdf = await prisma.pDF.create({
      data: { lectureId, title, fileUrl, order: order ?? 0 },
    });
    return success(pdf);
  } catch (e) {
    console.error("[pdfs POST]", e);
    return error("حدث خطأ", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const token   = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "OWNER") return forbidden();

  try {
    const { id } = await req.json();
    if (!id) return error("id مطلوب");
    await prisma.pDF.delete({ where: { id } });
    return success({ deleted: true });
  } catch (e) {
    console.error("[pdfs DELETE]", e);
    return error("فشل الحذف", 500);
  }
}
