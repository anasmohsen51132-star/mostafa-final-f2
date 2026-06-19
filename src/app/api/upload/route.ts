// src/app/api/upload/route.ts
import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden } from "@/lib/utils";

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

    // ── Upload to Vercel Blob ─────────────────────────────────
    const safeName = `uploads/${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, "_")}`;
    const blob = await put(safeName, file, {
      access: "public",
      contentType: file.type,
    });

    return success({
      url:  blob.url,
      name: file.name,
      type: file.type,
      size: file.size,
    });

  } catch (e) {
    console.error("[upload POST]", e);
    return error("حدث خطأ أثناء رفع الملف", 500);
  }
}
