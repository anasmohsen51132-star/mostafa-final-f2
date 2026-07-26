// src/lib/backup/notConfiguredProvider.ts
import type { BackupProvider } from "@/lib/backup/types";

export const notConfiguredBackupProvider: BackupProvider = {
  id: "none",
  isConfigured() {
    return false;
  },
  async getBackupStatus() {
    return {
      available: false,
      lastBackupAt: null,
      backupHealthy: null,
      storageHealthy: null,
      recoveryReadiness: "UNKNOWN",
      recommendations: [
        "لم يتم ربط Neon API بعد — اضبط NEON_API_KEY و NEON_PROJECT_ID ونفّذ NeonBackupProvider (انظر types.ts) لعرض بيانات النسخ الاحتياطي الحقيقية.",
      ],
    };
  },
};
