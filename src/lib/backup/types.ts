// src/lib/backup/types.ts
//
// Section 6 (Backup & Recovery) — interface + honest "not configured"
// state only, per explicit instruction: no Neon API integration yet.
// To wire real data later: implement this interface against Neon's API
// (https://api-docs.neon.tech — branches/backups endpoints) using a
// NEON_API_KEY + NEON_PROJECT_ID, and swap the export in registry.ts.
export interface BackupStatus {
  available: boolean;
  lastBackupAt: string | null;
  backupHealthy: boolean | null;
  storageHealthy: boolean | null;
  recoveryReadiness: "READY" | "DEGRADED" | "UNKNOWN";
  recommendations: string[];
}

export interface BackupProvider {
  id: string;
  isConfigured(): boolean;
  getBackupStatus(): Promise<BackupStatus>;
}
