# Solvyn v1.2 – Developer Infrastructure Edition

Solvyn is a headless computation orchestration engine for modern applications. It provides a deterministic math engine, sandboxed execution, and explicit AI escalation—with zero UI assumptions.

## Features

- **Headless Core**: Pure computation engine with no UI constraints.
- **Intelligent Pipeline**: Validator → Local Engine Attempt → AI Router → Post Processor.
- **Plugin System**: Extend Solvyn with domain-specific solvers (e.g., unit converters, finance calculators).
- **AI Adapters**: Inject your own AI providers (e.g., Gemini, OpenAI, Claude) with full prompt engineering control.
- **Strict Security**: No telemetry, no hidden network calls, deterministic local execution by default.
- **Framework Agnostic**: Works in Node.js, React, Next.js, Vue, Svelte, and Vanilla JS.

## Installation

Install the core engine and React bindings (if using React):

```bash
npm install @solvyn/core @solvyn/react
```

If you plan to use the Gemini AI adapter:

```bash
npm install @google/genai
```

## Quick Start (React)

```tsx
import React from 'react';
import { SolvynProvider, useSolvyn } from '@solvyn/react';
import { createGeminiAdapter } from '@solvyn/adapters';

// 1. Configure AI Adapter (Optional)
const geminiAdapter = createGeminiAdapter({
  apiKey: "YOUR_GEMINI_API_KEY",
  systemInstruction: "You are a helpful math assistant.",
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
  maxOutputTokens: 150
});

// 2. Configure Solvyn
const config = {
  mode: "auto",
  escalation: "auto",
  ai: geminiAdapter,
};

// 3. Build Your UI
function Calculator() {
  const { solve, result, status } = useSolvyn();

  return (
    <div>
      <input 
        type="text" 
        onKeyDown={(e) => {
          if (e.key === 'Enter') solve(e.currentTarget.value);
        }} 
        placeholder="Enter math expression..."
      />
      <div>Status: {status}</div>
      {result && <div>Result: {result.value}</div>}
    </div>
  );
}

// 4. Wrap with Provider
export default function App() {
  return (
    <SolvynProvider config={config}>
      <Calculator />
    </SolvynProvider>
  );
}
```

## Advanced Configuration

### AI Prompt Engineering

When creating an AI adapter, you can fine-tune its behavior using the following configuration options:

- `systemInstruction` (string): Custom instructions to guide the AI's behavior and tone.
- `temperature` (number, 0-1): Controls the randomness of the output. Default is `0.7`.
- `topP` (number, 0-1): Nucleus sampling. Default is `0.9`.
- `topK` (number): The number of top choices for the AI to consider. Default is `40`.
- `maxOutputTokens` (number): The maximum number of tokens to generate. Default is `150`.

```typescript
const geminiAdapter = createGeminiAdapter({
  apiKey: process.env.GEMINI_API_KEY,
  systemInstruction: "You are a sarcastic but helpful math genius. Always include a witty remark in your final answer.",
  temperature: 0.9,
  topP: 0.95,
  topK: 50,
  maxOutputTokens: 500
});
```

### Plugin System

Extend Solvyn with custom logic before it hits the math engine or AI.

```typescript
const unitConverterPlugin = {
  name: "unit-converter",
  match: (input: string) => input.toLowerCase().includes("km to miles"),
  solve: (input: string) => {
    const kmMatch = input.match(/(\d+(?:\.\d+)?)\s*km/i);
    if (kmMatch) {
      const km = parseFloat(kmMatch[1]);
      const miles = km * 0.621371;
      return { value: `${miles.toFixed(2)} miles` };
    }
    return { value: "Could not parse kilometers." };
  }
};

const config = {
  plugins: [unitConverterPlugin]
};
```

### Execution Modes

- `mode: "auto"` (Default): Attempts local evaluation first, then escalates to AI if configured.
- `mode: "strict-local"`: Guarantees no AI usage even if provided.
- `escalation: "manual"`: Emits an event (`ai:fallback`) instead of automatically calling the AI, allowing the developer to decide.
- `escalation: "auto"` (Default): Automatically falls back to AI if local evaluation fails.
- `escalation: "never"`: Strict offline mode.

## Architecture

Solvyn is divided into several packages (conceptually):

- `@solvyn/core`: Pure engine (no React)
- `@solvyn/react`: React bindings (optional UI helpers)
- `@solvyn/adapters`: AI providers + storage adapters
- `@solvyn/security`: Input sanitization + privacy shell

## Security Model

- **No Telemetry**: Solvyn does not track or log any data.
- **Sandboxed Execution**: Prevents infinite loops and dangerous expressions.
- **Input Sanitization**: Built-in limits on input length and basic XSS prevention.
- **Explicit AI**: AI is never called unless explicitly configured and injected by the developer.
