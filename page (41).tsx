// src/app/api/upload/route.ts
import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden } from "@/lib/utils";

const MAX_IMAGE_SIZE = 5  * 1024 * 1024; // 5 MB
const MAX_PDF_SIZE   = 20 * 1024 * 1024; // 20 MB

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_PDF_TYPES   = ["application/pdf"];

// SEC-003 FIX: file.type is supplied by the client and is trivially spoofed
// (e.g. rename malicious.html to file.pdf, set MIME to application/pdf).
// We verify the actual file bytes (magic numbers) match the claimed type
// before ever uploading to public Vercel Blob storage.
const MAGIC_BYTES: Record<string, (bytes: Uint8Array) => boolean> = {
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png":  (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  "image/gif":  (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38,
  "image/webp": (b) =>
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  "application/pdf": (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46, // %PDF
};

async function matchesMagicBytes(file: File, claimedType: string): Promise<boolean> {
  const check = MAGIC_BYTES[claimedType];
  if (!check) return false;
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  return check(head);
}

export async function POST(req: NextRequest) {
  const token   = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "OWNER") return forbidden();

  // INFRA-006 FIX: surface a clear, actionable error instead of an opaque 500
  // if the Vercel Blob token was never configured on this deployment.
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("[upload] BLOB_READ_WRITE_TOKEN غير معرّف في متغيرات البيئة");
    return error("خدمة رفع الملفات غير مهيأة على الخادم (BLOB_READ_WRITE_TOKEN مفقود)", 503);
  }

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

    // SEC-003 FIX: reject if actual bytes don't match the claimed MIME type.
    const verified = await matchesMagicBytes(file, file.type);
    if (!verified) {
      return error("محتوى الملف لا يطابق نوعه المعلن — تم رفض الرفع لأسباب أمنية");
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
