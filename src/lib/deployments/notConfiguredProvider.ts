// src/lib/deployments/notConfiguredProvider.ts
//
// Deliberately always reports unconfigured — this module has no real
// Vercel integration yet (see types.ts for how to add one). Even if
// VERCEL_TOKEN happens to be set, this specific provider implementation
// doesn't use it, so claiming "configured" here would be misleading.
import type { DeploymentProvider } from "@/lib/deployments/types";

export const notConfiguredDeploymentProvider: DeploymentProvider = {
  id: "none",
  isConfigured() {
    return false;
  },
  async listDeployments() {
    return [];
  },
};
