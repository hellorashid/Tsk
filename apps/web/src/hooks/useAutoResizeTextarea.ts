import { useEffect, RefObject } from 'react';

/**
 * Hook to automatically resize a textarea to fit its content.
 * 
 * @param ref - React ref to the textarea element
 * @param value - The current value of the textarea (triggers resize on change)
 * 
 * @example
 * const textareaRef = useRef<HTMLTextAreaElement>(null);
 * useAutoResizeTextarea(textareaRef, description);
 * 
 * <textarea ref={textareaRef} value={description} ... />
 */
export function useAutoResizeTextarea(
  ref: RefObject<HTMLTextAreaElement | null>,
  value: string
): void {
  useEffect(() => {
    const textarea = ref.current;
    if (textarea) {
      // Reset height to auto to get accurate scrollHeight measurement
      textarea.style.height = 'auto';
      // Set height to scrollHeight to show all content
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [ref, value]);
}

export default useAutoResizeTextarea;

