import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';

export function useTransientTip(durationMs = 2000) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    setVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), durationMs);
  }, [durationMs]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return { visible, show };
}

export function TransientTip({
  visible,
  children,
  isDarkMode,
  align = 'right',
}: {
  visible: boolean;
  children: ReactNode;
  isDarkMode: boolean;
  align?: 'left' | 'right' | 'center';
}) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 4, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.96 }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          className={`absolute bottom-full mb-2 px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap pointer-events-none z-50 shadow-lg ${
            align === 'right' ? 'right-0' : align === 'left' ? 'left-0' : 'left-1/2 -translate-x-1/2'
          } ${
            isDarkMode
              ? 'bg-gray-900 text-gray-100 border border-white/10'
              : 'bg-gray-900 text-white'
          }`}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
