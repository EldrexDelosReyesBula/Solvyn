import { SolvynAIProvider, SolvynAIResponse } from '../core/types';

export interface CustomAIAdapterConfig {
  endpoint: string;
  headers?: Record<string, string>;
  method?: string;
  bodyBuilder?: (input: string) => any;
  responseParser?: (response: any) => SolvynAIResponse;
}

export function createCustomAIAdapter(config: CustomAIAdapterConfig): SolvynAIProvider {
  return {
    name: "custom",
    solve: async (input: string): Promise<SolvynAIResponse> => {
      const method = config.method || 'POST';
      const headers = { 'Content-Type': 'application/json', ...config.headers };
      const body = config.bodyBuilder ? config.bodyBuilder(input) : { prompt: input };

      const res = await fetch(config.endpoint, {
        method,
        headers,
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        throw new Error(`Custom AI request failed: ${res.statusText}`);
      }

      const data = await res.json();
      
      if (config.responseParser) {
        return config.responseParser(data);
      }

      return {
        value: data.value || data.result || data.text || "No response"
      };
    }
  };
}
