import React, { useRef } from 'react';
import { useSolvyn } from './index';

export interface SolvynInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoCompute?: boolean;
  insertTabAfterCompute?: boolean;
  onComputeSuccess?: (result: string) => void;
  onComputeError?: (error: any) => void;
}

export const SolvynInput = React.forwardRef<HTMLTextAreaElement, SolvynInputProps>(({
  autoCompute = true,
  insertTabAfterCompute = true,
  onComputeSuccess,
  onComputeError,
  ...props
}, ref) => {
  const { solve } = useSolvyn();
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = (ref as any) || internalRef;

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === '=' && autoCompute) {
      e.preventDefault();
      const val = textareaRef.current?.value || '';
      
      // Find the current expression (e.g. after the last newline)
      const lines = val.split('\n');
      const lastLine = lines[lines.length - 1];
      const parts = lastLine.split('=');
      const currentExpr = parts[parts.length - 1].trim();

      if (!currentExpr) {
        textareaRef.current!.value = val + '=';
        return;
      }

      const res = await solve(currentExpr);
      
      if (res.status === 'success' && res.value) {
        const newVal = val + ` = (${res.value})`;
        textareaRef.current!.value = newVal;
        
        if (insertTabAfterCompute) {
          // Move focus to next focusable element
          const focusable = Array.from(document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'));
          const index = focusable.indexOf(textareaRef.current!);
          if (index > -1 && index < focusable.length - 1) {
            (focusable[index + 1] as HTMLElement).focus();
          } else {
            // If nothing to focus, just insert tab
            textareaRef.current!.value += '\t';
          }
        }
        
        // trigger onChange
        const event = new Event('input', { bubbles: true });
        textareaRef.current!.dispatchEvent(event);
        onComputeSuccess?.(res.value);
      } else {
        // If it fails, just insert the '=' normally
        textareaRef.current!.value = val + '=';
        onComputeError?.(res.error);
      }
    }
    props.onKeyDown?.(e);
  };

  return <textarea ref={textareaRef} onKeyDown={handleKeyDown} {...props} />;
});

SolvynInput.displayName = 'SolvynInput';
