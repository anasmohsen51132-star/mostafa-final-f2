// src/lib/backup/registry.ts
import { notConfiguredBackupProvider } from "@/lib/backup/notConfiguredProvider";
import type { BackupProvider } from "@/lib/backup/types";

export function getBackupProvider(): BackupProvider {
  return notConfiguredBackupProvider;
}
