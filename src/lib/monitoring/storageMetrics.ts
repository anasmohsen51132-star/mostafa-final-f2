// src/lib/monitoring/storageMetrics.ts
//
// Section 4 (Storage Monitor). Deliberately does NOT make a live network
// call to Vercel Blob on every dashboard poll — that would add real
// external latency (and, at Vercel Blob's request-based pricing, real
// cost) to a widget that refreshes automatically every few seconds (see
// Section 8). Instead, "availability" is inferred from two honest, real
// signals: whether the storage token is configured at all, and whether
// recent uploads (src/app/api/upload/route.ts) have actually been
// failing — both are what an operator actually wants to know ("is this
// broken right now") without needing a synthetic health-check request.
import prisma from "@/lib/prisma";
import type { StorageMetrics, HealthStatus } from "./types";

export async function getStorageMetrics(): Promise<StorageMetrics> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const configured = !!process.env.BLOB_READ_WRITE_TOKEN;

  const failedUploadsToday = await prisma.systemLog
    .count({
      where: { category: "UPLOAD", severity: { in: ["ERROR", "CRITICAL"] }, createdAt: { gte: startOfDay } },
    })
    .catch(() => 0);

  let status: HealthStatus = "HEALTHY";
  if (!configured) status = "CRITICAL";
  else if (failedUploadsToday >= 5) status = "CRITICAL";
  else if (failedUploadsToday > 0) status = "WARNING";

  return { configured, failedUploadsToday, status };
}
