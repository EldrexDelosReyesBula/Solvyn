import * as math from 'mathjs';
import { SolvynConfig, SolvynResult, SolvynPlugin, SolvynError } from './types';
import { sanitizeInput } from '../security/sanitizer';
import { HistoryManager } from './history';

export class SolvynEngine {
  private config: SolvynConfig;
  private plugins: SolvynPlugin[] = [];
  private listeners: Record<string, Function[]> = {};
  public history: HistoryManager;

  constructor(config: SolvynConfig = {}) {
    this.config = {
      mode: "auto",
      escalation: "auto",
      timeout: 5000,
      precision: 14,
      historyEnabled: true,
      maxInputLength: 500,
      ...config
    };
    if (config.plugins) {
      this.plugins = config.plugins;
    }
    this.history = new HistoryManager(this.config.historyStorage);
  }

  use(plugin: SolvynPlugin) {
    this.plugins.push(plugin);
  }

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  private emit(event: string, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  async solve(input: string): Promise<SolvynResult> {
    const startTime = performance.now();
    this.emit("solve:start", { input });

    let finalResult: SolvynResult;

    try {
      // 1. Sanitize
      const safeInput = sanitizeInput(input, this.config.maxInputLength);

      // 2. Plugins
      let pluginHandled = false;
      for (const plugin of this.plugins) {
        if (plugin.match(safeInput)) {
          const res = await plugin.solve(safeInput);
          finalResult = {
            status: "success",
            source: "plugin",
            value: res.value,
            steps: res.steps,
            executionTime: performance.now() - startTime
          };
          pluginHandled = true;
          break;
        }
      }

      if (!pluginHandled) {
        // 3. Local Math Engine
        let localSuccess = false;
        try {
          const mathResult = math.evaluate(safeInput);
          if (mathResult !== undefined && typeof mathResult !== 'function') {
            finalResult = {
              status: "success",
              source: "local",
              value: math.format(mathResult, { precision: this.config.precision }),
              executionTime: performance.now() - startTime
            };
            localSuccess = true;
          }
        } catch (e) {
          // Local engine failed, proceed to escalation
        }

        if (!localSuccess) {
          // 4. AI Escalation
          if (this.config.offlineOnly || this.config.mode === "strict-local" || this.config.escalation === "never" || !this.config.ai) {
            throw {
              code: "UNSUPPORTED_INPUT",
              message: "Unsupported query for offline mode.",
              suggestion: "Check your expression or enable AI fallback."
            };
          }

          if (this.config.escalation === "manual") {
            this.emit("ai:fallback", { input: safeInput });
            finalResult = {
              status: "fallback",
              executionTime: performance.now() - startTime
            };
          } else {
            // Auto escalation
            const aiRes = await this.config.ai.solve(safeInput);
            finalResult = {
              status: "success",
              source: "ai",
              value: aiRes.value,
              steps: aiRes.steps,
              confidence: aiRes.confidence,
              executionTime: performance.now() - startTime
            };
          }
        }
      }

      this.emit("solve:success", finalResult!);
    } catch (e: any) {
      const error: SolvynError = e.code ? e : {
        code: "INVALID_EXPRESSION",
        message: e.message || "Could not parse expression. Check parentheses.",
        suggestion: "Use standard math operators +, -, *, / or check your syntax."
      };
      finalResult = {
        status: "error",
        error,
        executionTime: performance.now() - startTime
      };
      this.emit("solve:error", finalResult);
    }

    if (this.config.historyEnabled && finalResult.status !== "evaluating" && finalResult.status !== "idle") {
      this.history.add({
        id: crypto.randomUUID(),
        input,
        result: finalResult,
        timestamp: Date.now()
      });
    }

    return finalResult;
  }
}

export function createSolvyn(config?: SolvynConfig) {
  return new SolvynEngine(config);
}
