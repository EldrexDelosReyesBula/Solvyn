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

export const useSolvyn = () => {
  const context = useContext(SolvynContext);
  if (!context) {
    throw new Error("useSolvyn must be used within a SolvynProvider");
  }
  return context;
};
