import { useRef, useCallback } from 'react';

const MAX_HEIGHT = 180;

export function useAutoResizeTextarea() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_HEIGHT)}px`;
  }, []);

  const resetHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
  }, []);

  return { textareaRef, handleInput, resetHeight };
}
