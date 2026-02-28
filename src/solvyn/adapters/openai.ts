import { SolvynAIProvider, SolvynAIResponse } from '../core/types';

export interface OpenAIAdapterConfig {
  apiKey: string;
  model?: string;
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
}

export function createOpenAIAdapter(config: OpenAIAdapterConfig): SolvynAIProvider {
  return {
    name: "openai",
    solve: async (input: string): Promise<SolvynAIResponse> => {
      const model = config.model || "gpt-4o-mini";
      const messages = [];
      
      if (config.systemInstruction) {
        messages.push({ role: "system", content: config.systemInstruction });
      }
      messages.push({ role: "user", content: input });

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: config.temperature ?? 0.7,
          max_tokens: config.maxTokens ?? 150
        })
      });

      if (!res.ok) {
        throw new Error(`OpenAI request failed: ${res.statusText}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || "";

      return {
        value: content.trim()
      };
    }
  };
}
