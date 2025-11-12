import { useEffect, useRef } from 'react';

/**
 * Custom hook to handle browser back button for modals
 * Pushes a history state when modal opens, and closes modal when back button is pressed
 * 
 * @param isOpen - Whether the modal is currently open
 * @param onClose - Callback to close the modal
 * @param modalId - Unique identifier for this modal (for debugging)
 */
export function useModalHistory(
  isOpen: boolean,
  onClose: () => void,
  modalId?: string
) {
  const hasHistoryRef = useRef(false);
  const isClosingRef = useRef(false);

  useEffect(() => {
    // When modal opens, push a history state
    if (isOpen && !hasHistoryRef.current) {
      // Push a new history entry with modal state
      window.history.pushState(
        { modal: modalId || 'modal-open', timestamp: Date.now() },
        ''
      );
      hasHistoryRef.current = true;
      isClosingRef.current = false;
    }

    // When modal closes programmatically (not via back button), remove the history entry
    if (!isOpen && hasHistoryRef.current && !isClosingRef.current) {
      // Modal was closed programmatically, go back to remove the history entry
      hasHistoryRef.current = false;
      window.history.back();
    }
  }, [isOpen, modalId]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // If modal is open and user pressed back, close the modal
      if (isOpen && hasHistoryRef.current) {
        isClosingRef.current = true;
        hasHistoryRef.current = false;
        onClose();
        
        // Reset the flag after a short delay
        setTimeout(() => {
          isClosingRef.current = false;
        }, 100);
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, onClose]);

  // Cleanup: remove history entry when component unmounts while modal is open
  useEffect(() => {
    return () => {
      if (hasHistoryRef.current && !isClosingRef.current) {
        hasHistoryRef.current = false;
        // Don't call history.back() on unmount to avoid navigation issues
      }
    };
  }, []);
}

