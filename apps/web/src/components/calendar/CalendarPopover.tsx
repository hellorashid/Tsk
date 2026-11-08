import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';

const VIEWPORT_MARGIN = 12;
const ANCHOR_GAP = 8;

interface CalendarPopoverProps {
  anchorEl: HTMLElement | null;
  label: string;
  onClose: () => void;
  children: React.ReactNode;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, Math.max(min, max)));

/** Floating panel beside its anchor, dismissed like a modal. It avoids covering the anchor when it can. */
const CalendarPopover: React.FC<CalendarPopoverProps> = ({ anchorEl, label, onClose, children }) => {
  const { theme } = useTheme();
  const { isDarkMode, accentColor } = theme;
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    let anchorRect = anchorEl?.getBoundingClientRect();

    const place = () => {
      if (anchorEl?.isConnected) {
        anchorRect = anchorEl.getBoundingClientRect();
      }
      const width = panel.offsetWidth;
      const height = panel.offsetHeight;
      const maxLeft = window.innerWidth - width - VIEWPORT_MARGIN;
      const maxTop = window.innerHeight - height - VIEWPORT_MARGIN;
      const rect = anchorRect ?? new DOMRect(window.innerWidth / 2, window.innerHeight / 2, 0, 0);

      let left: number;
      let top: number;
      if (rect.right + ANCHOR_GAP <= maxLeft) {
        left = rect.right + ANCHOR_GAP;
        top = rect.top;
      } else if (rect.left - ANCHOR_GAP - width >= VIEWPORT_MARGIN) {
        left = rect.left - ANCHOR_GAP - width;
        top = rect.top;
      } else {
        left = rect.left;
        top = rect.bottom + ANCHOR_GAP <= maxTop ? rect.bottom + ANCHOR_GAP : rect.top - ANCHOR_GAP - height;
      }

      panel.style.left = `${clamp(left, VIEWPORT_MARGIN, maxLeft)}px`;
      panel.style.top = `${clamp(top, VIEWPORT_MARGIN, maxTop)}px`;
      panel.style.opacity = '1';
    };

    place();
    const observer = new ResizeObserver(place);
    observer.observe(panel);
    window.addEventListener('resize', place);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', place);
    };
  }, [anchorEl]);

  useEffect(() => {
    const returnFocusTo = document.activeElement as HTMLElement | null;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (document.activeElement === document.body && returnFocusTo?.isConnected) {
        returnFocusTo.focus({ preventScroll: true });
      }
    };
  }, [onClose]);

  return createPortal(
    <>
      {/* Takes the outside click, so it only dismisses and can't reach the calendar behind. */}
      <div className="fixed inset-0 z-[9998]" aria-hidden onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-label={label}
        className={`fixed z-[9999] w-[min(320px,calc(100vw-24px))] max-h-[calc(100dvh-24px)] overflow-y-auto rounded-2xl border shadow-2xl backdrop-blur-3xl ${
          isDarkMode ? 'border-white/10 text-gray-100' : 'border-black/10 text-gray-900'
        }`}
        style={{
          left: 0,
          top: 0,
          // Not visibility:hidden, which would stop autoFocus before the panel is placed.
          opacity: 0,
          colorScheme: isDarkMode ? 'dark' : 'light',
          backgroundColor: isDarkMode ? `${accentColor}F2` : 'rgba(255, 255, 255, 0.92)',
        }}
      >
        {children}
      </div>
    </>,
    document.body,
  );
};

export default CalendarPopover;
