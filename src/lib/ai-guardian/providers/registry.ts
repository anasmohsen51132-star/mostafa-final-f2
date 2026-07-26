// src/lib/ai-guardian/providers/registry.ts
//
// Switching providers is a configuration change ONLY — set
// AI_GUARDIAN_PROVIDER to "claude" | "openai" | "gemini" and provide that
// provider's API key. No code in generateReport.ts, the API routes, or any
// dashboard page needs to change.
import type { AIProvider } from "@/lib/ai-guardian/providers/types";
import { claudeProvider } from "@/lib/ai-guardian/providers/claudeProvider";
import { openaiProvider } from "@/lib/ai-guardian/providers/openaiProvider";
import { geminiProvider } from "@/lib/ai-guardian/providers/geminiProvider";

const REGISTRY: Record<string, AIProvider> = {
  claude: claudeProvider,
  openai: openaiProvider,
  gemini: geminiProvider,
};

export function listProviders(): { id: string; displayName: string; configured: boolean }[] {
  return Object.values(REGISTRY).map((p) => ({ id: p.id, displayName: p.displayName, configured: p.isConfigured() }));
}

// Returns the configured provider selected via AI_GUARDIAN_PROVIDER (default
// "claude"), or null if that provider has no API key set — callers must
// handle null explicitly (see generateReport.ts) rather than silently
// falling back to a different provider than the one requested.
// Returns the active provider. If `preferredProviderId` is given (e.g.
// from a developer's DeveloperSettings.aiProvider — see Task 5 Settings)
// and that provider is configured, it wins; otherwise falls back to
// AI_GUARDIAN_PROVIDER (default "claude"). Returns null if neither is
// configured — callers must handle that explicitly rather than silently
// falling back to a different provider than the one requested.
export function getActiveProvider(preferredProviderId?: string | null): AIProvider | null {
  if (preferredProviderId) {
    const preferred = REGISTRY[preferredProviderId];
    if (preferred?.isConfigured()) return preferred;
  }
  const selected = process.env.AI_GUARDIAN_PROVIDER || "claude";
  const provider = REGISTRY[selected];
  if (!provider || !provider.isConfigured()) return null;
  return provider;
}
