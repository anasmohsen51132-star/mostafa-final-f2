// src/lib/deployments/types.ts
//
// Section 5 (Deployment Center) — interface + honest "not configured"
// state only, per explicit instruction: no Vercel API integration yet.
// To wire real data later: implement this interface against Vercel's
// REST API (https://vercel.com/docs/rest-api — GET /v6/deployments) using
// a VERCEL_TOKEN + VERCEL_PROJECT_ID, and swap the export in
// registry.ts — nothing else in this codebase needs to change.
export interface DeploymentRecord {
  id: string;
  version: string | null;
  commit: string | null;
  environment: string;
  status: "READY" | "BUILDING" | "ERROR" | "CANCELED" | "QUEUED";
  durationMs: number | null;
  createdAt: string;
  rollbackReady: boolean;
}

export interface DeploymentProvider {
  id: string;
  isConfigured(): boolean;
  listDeployments(limit: number): Promise<DeploymentRecord[]>;
}
