import * as math from 'mathjs';
import { GoogleGenAI, Type } from '@google/genai';
import { SolvynAIConfig } from './types';

export async function evaluateMath(input: string): Promise<{ result: string; isMath: boolean; steps?: string[] }> {
  try {
    // Try evaluating with mathjs first
    const result = math.evaluate(input);
    if (result !== undefined && typeof result !== 'function') {
      return { result: math.format(result, { precision: 14 }), isMath: true };
    }
  } catch (e) {
    // If it fails, it might be a complex formula or natural language
  }
  return { result: '', isMath: false };
}

export async function evaluateWithAI(input: string, aiConfig?: SolvynAIConfig): Promise<{ result: string; steps?: string[] }> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("AI provider not configured (missing API key)");
    }
    const ai = new GoogleGenAI({ apiKey });
    
    const systemInstruction = aiConfig?.systemInstruction || "You are a math and logic solver. Solve the following expression or answer the question. If it's a math problem, provide a concise final answer and optionally a step-by-step breakdown.";
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Input: ${input}`,
      config: {
        systemInstruction,
        temperature: aiConfig?.temperature ?? 0.7,
        maxOutputTokens: aiConfig?.maxOutputTokens,
        topP: aiConfig?.topP,
        topK: aiConfig?.topK,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            result: {
              type: Type.STRING,
              description: "The final answer or result."
            },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING
              },
              description: "Optional step-by-step breakdown of the solution."
            }
          },
          required: ["result"]
        }
      }
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      return { result: parsed.result, steps: parsed.steps };
    }
    throw new Error("Empty response from AI");
  } catch (e: any) {
    console.error("AI Evaluation error:", e);
    throw new Error(e.message || "Failed to evaluate with AI");
  }
}
