import { GoogleGenAI, Type } from '@google/genai';
import { SolvynAIProvider, SolvynAIResponse } from '../core/types';

export interface GeminiAdapterConfig {
  apiKey: string;
  systemInstruction?: string;
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
}

export function createGeminiAdapter(config: GeminiAdapterConfig): SolvynAIProvider {
  const ai = new GoogleGenAI({ apiKey: config.apiKey });
  
  return {
    name: "gemini",
    async solve(input: string): Promise<SolvynAIResponse> {
      const systemInstruction = config.systemInstruction || "You are a math and logic solver. Solve the expression or answer the question. Provide a concise final answer and optionally a step-by-step breakdown.";
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Input: ${input}`,
        config: {
          systemInstruction,
          temperature: config.temperature ?? 0.7,
          topP: config.topP ?? 0.9,
          topK: config.topK ?? 40,
          maxOutputTokens: config.maxOutputTokens ?? 150,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              result: { type: Type.STRING },
              steps: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["result"]
          }
        }
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        return { value: parsed.result, steps: parsed.steps };
      }
      throw new Error("Empty response from Gemini");
    }
  };
}
