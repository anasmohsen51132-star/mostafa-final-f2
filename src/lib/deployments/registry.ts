// src/lib/deployments/registry.ts
//
// The ONLY place to change when real Vercel integration is added: swap
// `notConfiguredDeploymentProvider` for a real VercelDeploymentProvider
// implementing the same DeploymentProvider interface (types.ts). Nothing
// in the API route or the page needs to change.
import { notConfiguredDeploymentProvider } from "@/lib/deployments/notConfiguredProvider";
import type { DeploymentProvider } from "@/lib/deployments/types";

export function getDeploymentProvider(): DeploymentProvider {
  return notConfiguredDeploymentProvider;
}
