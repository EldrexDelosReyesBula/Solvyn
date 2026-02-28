export type SolvynStatus = "success" | "error" | "fallback" | "idle" | "evaluating";

export type SolvynSource = "local" | "ai" | "plugin" | "demo";

export interface SolvynResult {
  status: SolvynStatus;
  value?: string;
  steps?: string[];
  source?: SolvynSource;
  confidence?: number;
  executionTime: number;
  error?: SolvynError;
}

export interface SolvynError {
  code: string;
  message: string;
  suggestion?: string;
}

export interface SolvynAIResponse {
  value: string;
  steps?: string[];
  confidence?: number;
}

export interface SolvynAIProvider {
  name: string;
  solve: (input: string, context?: any) => Promise<SolvynAIResponse>;
}

export interface SolvynPlugin {
  name: string;
  match: (input: string) => boolean;
  solve: (input: string) => Promise<{ value: string; steps?: string[] }> | { value: string; steps?: string[] };
}

export interface SolvynConfig {
  mode?: "auto" | "strict-local";
  escalation?: "manual" | "auto" | "never";
  ai?: SolvynAIProvider | null;
  historyEnabled?: boolean;
  historyStorage?: "memory" | "localStorage" | "indexedDB" | any;
  maxHistoryItems?: number;
  plugins?: SolvynPlugin[];
  timeout?: number;
  precision?: number;
  maxInputLength?: number;
  offlineOnly?: boolean;
  autoCompute?: boolean;
  insertTabAfterCompute?: boolean;
  resultFormat?: "inline" | "tooltip" | "modal";
}
