// src/lib/ai-guardian/providers/claudeProvider.ts
//
// Talks to Anthropic's Messages API directly via fetch — deliberately no
// @anthropic-ai/sdk dependency, so adopting this provider adds zero new
// packages to the project. Configured via env vars only:
//   ANTHROPIC_API_KEY        (required)
//   AI_GUARDIAN_CLAUDE_MODEL (optional, defaults below)
import type { AIProvider, AIProviderResult } from "@/lib/ai-guardian/providers/types";
import { AIProviderError } from "@/lib/ai-guardian/providers/types";

const DEFAULT_MODEL = "claude-sonnet-5";
const ANTHROPIC_VERSION = "2023-06-01";

export const claudeProvider: AIProvider = {
  id: "claude",
  displayName: "Claude (Anthropic)",

  isConfigured() {
    return Boolean(process.env.ANTHROPIC_API_KEY);
  },

  async generate(systemPrompt, userPrompt): Promise<AIProviderResult> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new AIProviderError("claude", "ANTHROPIC_API_KEY غير مُعرَّف");

    const model = process.env.AI_GUARDIAN_CLAUDE_MODEL || DEFAULT_MODEL;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new AIProviderError("claude", `فشل استدعاء Claude API (HTTP ${res.status}): ${detail.slice(0, 300)}`);
    }

    const data = await res.json();
    const textBlock = Array.isArray(data.content)
      ? data.content.find((b: { type: string }) => b.type === "text")
      : null;

    if (!textBlock?.text) throw new AIProviderError("claude", "استجابة Claude لا تحتوي على نص");

    return {
      rawText: textBlock.text,
      model,
      tokensUsed: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0) || null,
    };
  },
};
