// src/lib/drive-link.ts
//
// Shared helper for turning a plain Google Drive "Share → Copy link" URL
// into a URL that actually serves the file's bytes. A share link on its
// own (drive.google.com/file/d/XXXX/view) just opens Drive's HTML viewer
// page — neither <img src> nor a PDF download will work with it directly.
// The file must be shared as "Anyone with the link" for either form below
// to load.

export function extractDriveFileId(url: string): string | null {
  const trimmed = url.trim();
  const m =
    trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/drive\.google\.com\/uc\?(?:export=(?:view|download)&)?id=([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

// For <img src> — renders the file inline as an image.
export function toDriveImageUrl(url: string): string {
  const id = extractDriveFileId(url);
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w2000` : url.trim();
}

// For a downloadable/openable file link (PDFs, etc).
export function toDriveDownloadUrl(url: string): string {
  const id = extractDriveFileId(url);
  return id ? `https://drive.google.com/uc?export=download&id=${id}` : url.trim();
}
