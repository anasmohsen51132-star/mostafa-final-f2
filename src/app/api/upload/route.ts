// src/app/api/upload/route.ts
// App Router file upload — accepts multipart/form-data
// Returns a data-URL (works in dev without external storage)
// In production: swap the buffer→dataUrl section for Vercel Blob / S3 / Cloudinary
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden } from "@/lib/utils";

// NOTE: No `export const config` here — that's Pages Router only.
// App Router handles body parsing automatically via request.formData()

const MAX_IMAGE_SIZE = 5  * 1024 * 1024; // 5 MB
const MAX_PDF_SIZE   = 20 * 1024 * 1024; // 20 MB

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_PDF_TYPES   = ["application/pdf"];

export async function POST(req: NextRequest) {
  const token   = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "OWNER") return forbidden();

  try {
    const formData = await req.formData();
    const file     = formData.get("file") as File | null;
    const type     = ((formData.get("type") as string) || "image").toLowerCase();

    if (!file || !(file instanceof File)) return error("لم يتم إرسال ملف");
    if (!file.size)                        return error("الملف فارغ");

    const isImage = type === "image";
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_PDF_SIZE;
    const allowed = isImage ? ALLOWED_IMAGE_TYPES : ALLOWED_PDF_TYPES;

    if (file.size > maxSize) {
      return error(`حجم الملف يتجاوز الحد المسموح (${isImage ? "5MB" : "20MB"})`);
    }

    if (!allowed.includes(file.type)) {
      return error(`نوع الملف غير مدعوم. المسموح: ${allowed.join(", ")}`);
    }

    // ── Convert to base64 data-URL ──────────────────────────
    // Works in dev/Vercel without external storage.
    // For production with many images, replace with:
    //   const { url } = await put(file.name, file, { access: "public" }); // Vercel Blob
    const bytes   = await file.arrayBuffer();
    const base64  = Buffer.from(bytes).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    return success({
      url:  dataUrl,
      name: file.name,
      type: file.type,
      size: file.size,
    });
  } catch (e) {
    console.error("[upload POST]", e);
    return error("حدث خطأ أثناء رفع الملف", 500);
  }
}
