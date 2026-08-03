// src/lib/upload-with-progress.ts
//
// Uploads a File to /api/upload using XMLHttpRequest instead of fetch.
// fetch() has no upload-progress event — it only tells you when the
// *response* starts arriving, not how many bytes of the request body have
// actually left the browser. XHR's `upload.onprogress` is the only native
// way to get a real, live percentage while a large PDF/image is still
// being sent. The response shape is identical to what every existing
// fetch()-based caller of /api/upload already expects, so this is a
// drop-in replacement — nothing on the server changes.

export interface UploadResult {
  success: boolean;
  data?: { url: string };
  error?: string;
}

export function uploadWithProgress(
  file: File,
  type: "image" | "pdf",
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", type);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      let json: UploadResult;
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        reject(new Error("استجابة غير متوقعة من الخادم"));
        return;
      }
      resolve(json);
    };

    xhr.onerror = () => reject(new Error("فشل الاتصال بالخادم"));
    xhr.send(fd);
  });
}
