import React, { useState, useEffect } from 'react';
import { SolvynProvider, useSolvyn, SolvynInput } from './solvyn/react';
import { Github, Terminal, Zap, Shield, Code2, Box, Cpu, BookOpen, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';

// A custom plugin example for the demo (hardcoded AI responses)
const demoPlugin = {
  name: "demo-hardcoded",
  match: (input: string) => input.toLowerCase().includes("integrate") || input.toLowerCase().includes("speed of light"),
  solve: (input: string) => {
    if (input.toLowerCase().includes("integrate x^2")) return { value: "x^3/3 + C" };
    if (input.toLowerCase().includes("speed of light")) return { value: "299,792,458 m/s" };
    return { value: "Demo response for: " + input };
  }
};

const solvynConfig = {
  mode: "auto" as const,
  escalation: "never" as const, // No real AI for demo
  offlineOnly: true,
  plugins: [demoPlugin],
  historyEnabled: true,
  historyStorage: "localStorage"
};

function AutoComputeDemo() {
  const { history } = useSolvyn();

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xl">
      <div className="bg-zinc-50 dark:bg-zinc-950 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 font-medium text-sm">
          <Zap className="w-4 h-4 text-emerald-500" />
          <span>Auto-Compute on '='</span>
        </div>
      </div>
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Try typing: <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-400">10 + 20 =</code></label>
          <SolvynInput
            autoCompute={true}
            insertTabAfterCompute={true}
            placeholder="Type a math expression and press '='"
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none h-24 font-mono"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Next input (focus moves here on tab)</label>
          <input
            type="text"
            placeholder="Focus will jump here..."
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>

        <AnimatePresence>
          {history.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="pt-4 border-t border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3">
                <Clock className="w-4 h-4" />
                History
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {[...history].reverse().map((item) => (
                  <div key={item.id} className="text-sm flex justify-between items-center bg-zinc-50 dark:bg-zinc-950 px-3 py-2 rounded-md border border-zinc-100 dark:border-zinc-800">
                    <span className="font-mono text-zinc-600 dark:text-zinc-400 truncate max-w-[60%]">{item.input}</span>
                    <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">{item.result.value || item.result.error?.message}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const readmeContent = `
# Solvyn v1.4 – Production Ready Developer Library

Solvyn is a headless computation orchestration engine for modern applications. It provides a deterministic math engine, sandboxed execution, and explicit AI escalation—with zero UI assumptions.

## Features

- **Auto-Compute on \`=\`**: Automatically evaluates expressions when the user types \`=\` and appends the result.
- **Auto-Tab**: Inserts a tab character or moves focus to the next input after computation.
- **Headless Core**: Pure computation engine with no UI constraints.
- **History & Storage**: Tracks input and result history with configurable storage adapters (Memory, LocalStorage, IndexedDB, Cloud).
- **Intelligent Pipeline**: Validator → Local Engine Attempt → AI Router → Post Processor.
- **Plugin System**: Extend Solvyn with domain-specific solvers (e.g., unit converters, finance calculators).
- **Strict Security**: No telemetry, no hidden network calls, deterministic local execution by default.
- **Structured Error Handling**: Developer-friendly error objects with suggestions.

## Installation

Install the core engine and React bindings (if using React):

\`\`\`bash
npm install @solvyn/core @solvyn/react
\`\`\`

## Quick Start (React)

\`\`\`tsx
import React from 'react';
import { SolvynProvider, SolvynInput } from '@solvyn/react';

const config = {
  autoCompute: true,
  insertTabAfterCompute: true,
  historyEnabled: true,
  historyStorage: "localStorage",
  offlineOnly: true
};

export default function App() {
  return (
    <SolvynProvider config={config}>
      <SolvynInput 
        className="my-input-class"
        placeholder="Type 1+2="
        resultFormat="inline" // "inline" | "tooltip" | "modal"
      />
    </SolvynProvider>
  );
}
\`\`\`

## React Hook Example

You can also use the \`useSolvyn\` hook directly. It can inherit from the \`SolvynProvider\` or create a local instance if you pass a config.

\`\`\`tsx
import { useSolvyn } from "@solvyn/react";

function MyComponent() {
  const { solve, result, history, events } = useSolvyn({ 
    autoCompute: true,
    historyEnabled: true,
    historyStorage: "indexedDB"
  });

  // ...
}
\`\`\`

## Advanced Configuration

### Execution Modes

- \`mode: "auto"\` (Default): Attempts local evaluation first, then escalates to AI if configured.
- \`mode: "strict-local"\`: Guarantees no AI usage even if provided.
- \`offlineOnly: true\`: Strict offline mode, disables all external calls.

### Storage Adapters

Solvyn v1.4 introduces flexible storage adapters for history persistence.

\`\`\`tsx
const config = {
  historyEnabled: true,
  historyStorage: "localStorage" // "memory", "localStorage", "indexedDB", "cloud", or a custom adapter instance
};
\`\`\`

### AI Integration (Optional)

Multi-provider support: OpenAI, Claude, Gemini, Custom API. AI is **developer-controlled**; no auto-requests.

\`\`\`ts
import { createOpenAIAdapter } from '@solvyn/adapters';

const config = {
  ai: createOpenAIAdapter({
    apiKey: process.env.OPENAI_API_KEY,
    systemInstruction: "Solve math only"
  }),
  escalation: "auto" // "manual" | "auto" | "never"
};
\`\`\`

### Plugin System

Extensible solvers or computation modules.

\`\`\`ts
const config = {
  plugins: [{
    name: "finance-calculator",
    match: input => input.includes("interest"),
    solve: input => ({ value: "..." })
  }]
};
\`\`\`

### Error Handling

Structured errors provide clear feedback.

\`\`\`ts
{
  code: "INVALID_EXPRESSION",
  message: "Could not parse expression. Check parentheses.",
  suggestion: "Use standard math operators +, -, *, / or check your syntax."
}
\`\`\`

## Security Model

- **No Telemetry**: Solvyn does not track or log any data.
- **Sandboxed Execution**: Prevents infinite loops and dangerous expressions.
- **Input Sanitization**: Built-in limits on input length and basic XSS prevention.
- **Explicit AI**: AI is never called unless explicitly configured and injected by the developer.

## Contribution Guide

1. Fork the repository.
2. Create a feature branch (\`git checkout -b feature/my-feature\`).
3. Commit your changes (\`git commit -am 'Add my feature'\`).
4. Push to the branch (\`git push origin feature/my-feature\`).
5. Open a Pull Request.
`;

export default function App() {
  const [activeTab, setActiveTab] = useState<'demo' | 'docs'>('demo');

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-blue-500/30">
      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="w-8 h-8 bg-zinc-900 dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-zinc-900">
              <Cpu className="w-5 h-5" />
            </div>
            Solvyn <span className="text-xs px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full ml-2 font-mono">v1.4</span>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <button 
              onClick={() => setActiveTab('demo')}
              className={`transition-colors ${activeTab === 'demo' ? 'text-zinc-900 dark:text-zinc-100 font-semibold' : 'hover:text-zinc-900 dark:hover:text-zinc-100'}`}
            >
              Demo
            </button>
            <button 
              onClick={() => setActiveTab('docs')}
              className={`transition-colors flex items-center gap-1 ${activeTab === 'docs' ? 'text-zinc-900 dark:text-zinc-100 font-semibold' : 'hover:text-zinc-900 dark:hover:text-zinc-100'}`}
            >
              <BookOpen className="w-4 h-4" /> Docs
            </button>
            <a href="https://github.com/EldrexDelosReyesBula/Solvyn" target="_blank" rel="noreferrer" className="text-zinc-900 dark:text-zinc-100 ml-4">
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </nav>

      <main>
        {activeTab === 'demo' ? (
          <>
            <section className="pt-24 pb-16 px-6">
              <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
                  Smart Input & <br />
                  <span className="text-zinc-500 dark:text-zinc-400">Auto-Solve Engine</span>
                </h1>
                <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                  Solvyn v1.4 introduces plug-and-play input intelligence with robust storage adapters. Automatically detect and compute formulas when users type <code className="bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-sm text-zinc-900 dark:text-zinc-100">=</code>.
                </p>
                
                <div className="flex items-center justify-center gap-4 font-mono text-sm">
                  <div className="px-4 py-2 bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
                    npm install @solvyn/core @solvyn/react
                  </div>
                </div>
              </div>
            </section>

            <section className="py-16 px-6">
              <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight mb-4">The Magic '=' Workflow</h2>
                  <p className="text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                    Drop the <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-sm">&lt;SolvynInput /&gt;</code> component into your app. When a user types an expression and presses <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-sm">=</code>, Solvyn evaluates it, appends the result, and automatically moves focus to the next field.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                        <Zap className="w-3 h-3" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Auto-Compute</h4>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Evaluates math instantly on '=' keypress.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                        <Shield className="w-3 h-3" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Offline & Secure</h4>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Deterministic local execution. No live AI in this demo.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                        <Clock className="w-3 h-3" />
                      </div>
                      <div>
                        <h4 className="font-semibold">History Tracking</h4>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Automatically tracks inputs and results per instance.</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <SolvynProvider config={solvynConfig}>
                    <AutoComputeDemo />
                  </SolvynProvider>
                </div>
              </div>
            </section>
          </>
        ) : (
          <section className="py-12 px-6">
            <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 md:p-12 shadow-sm">
              <div className="prose prose-zinc dark:prose-invert max-w-none prose-pre:bg-zinc-100 dark:prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-200 dark:prose-pre:border-zinc-800">
                <Markdown>{readmeContent}</Markdown>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
