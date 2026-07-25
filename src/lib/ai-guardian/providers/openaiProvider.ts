// src/lib/ai-guardian/providers/openaiProvider.ts
//
// Env vars: OPENAI_API_KEY (required), AI_GUARDIAN_OPENAI_MODEL (optional).
import type { AIProvider, AIProviderResult } from "@/lib/ai-guardian/providers/types";
import { AIProviderError } from "@/lib/ai-guardian/providers/types";

const DEFAULT_MODEL = "gpt-4o";

export const openaiProvider: AIProvider = {
  id: "openai",
  displayName: "OpenAI",

  isConfigured() {
    return Boolean(process.env.OPENAI_API_KEY);
  },

  async generate(systemPrompt, userPrompt): Promise<AIProviderResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new AIProviderError("openai", "OPENAI_API_KEY غير مُعرَّف");

    const model = process.env.AI_GUARDIAN_OPENAI_MODEL || DEFAULT_MODEL;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new AIProviderError("openai", `فشل استدعاء OpenAI API (HTTP ${res.status}): ${detail.slice(0, 300)}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new AIProviderError("openai", "استجابة OpenAI لا تحتوي على نص");

    return {
      rawText: text,
      model,
      tokensUsed: data.usage?.total_tokens ?? null,
    };
  },
};
