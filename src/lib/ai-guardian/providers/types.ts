// src/lib/ai-guardian/providers/types.ts
//
// Every provider implements exactly this. generateReport.ts (the
// orchestrator) never imports a specific provider directly — it only ever
// talks to this interface, resolved at runtime by registry.ts. Adding a
// new provider means adding one new file here and one line in registry.ts;
// nothing else in the AI Guardian changes.
export interface AIProviderResult {
  rawText: string;
  model: string;
  tokensUsed: number | null;
}

export interface AIProvider {
  id: string;
  displayName: string;
  // Whether this provider has the environment variables it needs. Checked
  // before every call so an unconfigured provider fails fast with a clear
  // message instead of a confusing network/auth error.
  isConfigured(): boolean;
  generate(systemPrompt: string, userPrompt: string): Promise<AIProviderResult>;
}

export class AIProviderError extends Error {
  constructor(public providerId: string, message: string) {
    super(message);
    this.name = "AIProviderError";
  }
}
