import React, { createContext, useContext, useState, useCallback, useRef, ReactNode, useEffect } from 'react';
import { SolvynEngine, createSolvyn } from '../core/engine';
import { SolvynConfig, SolvynResult, SolvynStatus } from '../core/types';
import { SolvynHistoryItem } from '../core/history';

export * from './SolvynInput';

interface SolvynContextValue {
  engine: SolvynEngine;
  solve: (input: string) => Promise<SolvynResult>;
  result: SolvynResult | null;
  status: SolvynStatus;
  history: SolvynHistoryItem[];
}

const SolvynContext = createContext<SolvynContextValue | null>(null);

export const SolvynProvider: React.FC<{ config?: SolvynConfig; children: ReactNode | ((props: SolvynContextValue) => ReactNode) }> = ({ config, children }) => {
  const engineRef = useRef<SolvynEngine>(createSolvyn(config));
  const [result, setResult] = useState<SolvynResult | null>(null);
  const [status, setStatus] = useState<SolvynStatus>("idle");
  const [history, setHistory] = useState<SolvynHistoryItem[]>([]);

  useEffect(() => {
    // Load initial history
    const loadHistory = async () => {
      // Wait a tick for the async init in HistoryManager to complete
      await new Promise(resolve => setTimeout(resolve, 50));
      setHistory(engineRef.current.history.get());
    };
    loadHistory();
  }, []);

  const solve = useCallback(async (input: string) => {
    setStatus("evaluating");
    const res = await engineRef.current.solve(input);
    setResult(res);
    setStatus(res.status);
    setHistory(engineRef.current.history.get());
    return res;
  }, []);

  const value = {
    engine: engineRef.current,
    solve,
    result,
    status,
    history
  };

  return (
    <SolvynContext.Provider value={value}>
      {typeof children === 'function' ? children(value) : children}
    </SolvynContext.Provider>
  );
};

export const useSolvyn = (localConfig?: SolvynConfig) => {
  const context = useContext(SolvynContext);
  
  // If localConfig is provided, we create a local instance, bypassing context
  const [localEngine] = useState(() => localConfig ? createSolvyn(localConfig) : null);
  const [result, setResult] = useState<SolvynResult | null>(null);
  const [status, setStatus] = useState<SolvynStatus>("idle");
  const [history, setHistory] = useState<SolvynHistoryItem[]>([]);

  useEffect(() => {
    if (localEngine) {
      const loadHistory = async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        setHistory(localEngine.history.get());
      };
      loadHistory();
    }
  }, [localEngine]);

  const localSolve = useCallback(async (input: string) => {
    if (!localEngine) return {} as SolvynResult;
    setStatus("evaluating");
    const res = await localEngine.solve(input);
    setResult(res);
    setStatus(res.status);
    setHistory(localEngine.history.get());
    return res;
  }, [localEngine]);

  if (localConfig && localEngine) {
    return {
      engine: localEngine,
      solve: localSolve,
      result,
      status,
      history,
      events: localEngine // Expose engine directly for events like engine.on('...')
    };
  }

  if (!context) {
    throw new Error("useSolvyn must be used within a SolvynProvider or provided with a local config");
  }
  
  return {
    ...context,
    events: context.engine
  };
};
