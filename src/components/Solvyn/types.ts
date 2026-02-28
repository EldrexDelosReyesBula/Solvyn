export interface SolvynAIConfig {
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
}

export interface SolvynProps {
  container?: 'inline' | 'card' | 'fullscreen';
  inputPosition?: 'top' | 'bottom' | 'center';
  aiEnabled?: boolean;
  aiProvider?: 'openai' | 'claude' | 'gemini' | 'custom';
  aiConfig?: SolvynAIConfig;
  theme?: {
    primaryColor?: string;
    fontFamily?: string;
  };
  onSolve?: (result: string) => void;
  onAIResponse?: (response: string) => void;
  onError?: (error: string) => void;
  placeholder?: string;
  className?: string;
}
