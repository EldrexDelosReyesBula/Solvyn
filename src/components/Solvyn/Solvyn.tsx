import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Calculator, AlertCircle, ChevronDown, ChevronUp, CornerDownLeft } from 'lucide-react';
import { SolvynProps } from './types';
import { evaluateMath, evaluateWithAI } from './engine';

export const Solvyn: React.FC<SolvynProps> = ({
  container = 'card',
  inputPosition = 'top',
  aiEnabled = true,
  aiConfig,
  theme,
  onSolve,
  onAIResponse,
  onError,
  placeholder = "Type a math problem or ask a question...",
  className = ""
}) => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [steps, setSteps] = useState<string[] | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  const [source, setSource] = useState<'math' | 'ai' | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const primaryColor = theme?.primaryColor || '#007AFF';
  const fontFamily = theme?.fontFamily || 'inherit';

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [input]);

  const handleSolve = async () => {
    if (!input.trim()) return;
    
    setIsEvaluating(true);
    setError(null);
    setResult(null);
    setSteps(null);
    setSource(null);
    setShowSteps(false);

    try {
      // 1. Try offline math engine
      const mathRes = await evaluateMath(input);
      if (mathRes.isMath) {
        setResult(mathRes.result);
        setSource('math');
        onSolve?.(mathRes.result);
        setIsEvaluating(false);
        return;
      }

      // 2. Fallback to AI if enabled
      if (aiEnabled) {
        setSource('ai');
        const aiRes = await evaluateWithAI(input, aiConfig);
        setResult(aiRes.result);
        if (aiRes.steps && aiRes.steps.length > 0) {
          setSteps(aiRes.steps);
        }
        onAIResponse?.(aiRes.result);
      } else {
        throw new Error("Invalid math expression and AI is disabled.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
      onError?.(err.message);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSolve();
    }
  };

  const containerClasses = {
    inline: 'bg-transparent',
    card: 'bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-4',
    fullscreen: 'fixed inset-0 bg-white dark:bg-zinc-950 z-50 p-6 flex flex-col'
  };

  return (
    <div 
      className={`flex flex-col gap-4 transition-all duration-300 ${containerClasses[container]} ${className}`}
      style={{ fontFamily }}
    >
      {/* Input Area */}
      <div className={`relative flex items-end gap-2 ${inputPosition === 'bottom' ? 'order-last' : ''}`}>
        <div className="relative flex-1 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700/50 focus-within:border-blue-500 dark:focus-within:border-blue-500 transition-colors overflow-hidden">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full bg-transparent p-4 outline-none resize-none min-h-[56px] max-h-[200px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
            rows={1}
          />
          <div className="absolute right-3 bottom-3 flex items-center gap-2 text-zinc-400">
            {aiEnabled && <Sparkles className="w-4 h-4" />}
          </div>
        </div>
        <button
          onClick={handleSolve}
          disabled={isEvaluating || !input.trim()}
          className="h-14 w-14 flex items-center justify-center rounded-xl text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-95 shrink-0"
          style={{ backgroundColor: primaryColor }}
        >
          {isEvaluating ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <CornerDownLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Results Area */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-2 text-red-500 bg-red-50 dark:bg-red-500/10 p-3 rounded-lg text-sm"
          >
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </motion.div>
        )}

        {result && !error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col gap-3"
          >
            <div className="flex items-start justify-between p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-100 dark:border-zinc-800">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  {source === 'math' ? <Calculator className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                  {source === 'math' ? 'Local Engine' : 'AI Solver'}
                </span>
                <span className="text-xl font-medium text-zinc-900 dark:text-zinc-100">
                  {result}
                </span>
              </div>
              
              {steps && steps.length > 0 && (
                <button
                  onClick={() => setShowSteps(!showSteps)}
                  className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors px-2 py-1 rounded-md hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50"
                >
                  {showSteps ? 'Hide Steps' : 'Show Steps'}
                  {showSteps ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>

            <AnimatePresence>
              {showSteps && steps && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col gap-2 pl-4 border-l-2 border-zinc-200 dark:border-zinc-800 py-2">
                    {steps.map((step, idx) => (
                      <div key={idx} className="flex gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                        <span className="font-mono text-xs text-zinc-400 mt-0.5">{idx + 1}.</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
