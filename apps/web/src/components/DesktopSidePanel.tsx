import React, { useMemo } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { UserMenu, type UserMenuItem } from '@basictech/react';
import { useTheme, getGlassSurface } from '../contexts/ThemeContext';

type ScheduleViewMode = 'timeline' | 'agenda';

const EASE_DRAWER = [0.32, 0.72, 0, 1] as const;

interface DesktopSidePanelProps {
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  /** When expanded (settings), back returns home. */
  onBack?: () => void;
  viewMode: ScheduleViewMode;
  onViewModeChange: (mode: ScheduleViewMode) => void;
  /** Full-width mode (e.g. settings) — tasks column is hidden by the parent. */
  expanded?: boolean;
  children: React.ReactNode;
}

/** Desktop calendar/agenda panel with logo + avatar rail inside the same rounded shell. */
export function DesktopSidePanel({
  onOpenSettings,
  onOpenAbout,
  onBack,
  viewMode,
  onViewModeChange,
  expanded = false,
  children,
}: DesktopSidePanelProps) {
  const { theme } = useTheme();
  const { isDarkMode, accentColor } = theme;
  const reduceMotion = useReducedMotion();

  const userMenuItems = useMemo<UserMenuItem[]>(() => [
    {
      id: 'settings',
      label: 'Settings',
      onClick: onOpenSettings,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: '1em', height: '1em' }}>
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      id: 'about',
      label: 'About tsk',
      onClick: onOpenAbout,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: '1em', height: '1em' }}>
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      ),
    },
  ], [onOpenSettings, onOpenAbout]);

  const iconBtn = (active: boolean) =>
    `pressable flex items-center justify-center size-9 rounded-lg transition-[color,background-color] duration-150 ${
      active
        ? isDarkMode
          ? 'bg-white/15 text-white'
          : 'bg-white text-gray-900 shadow-sm'
        : isDarkMode
          ? 'text-white/40 hover:text-white/80 hover:bg-white/5'
          : 'text-black/55 hover:text-black/85 hover:bg-black/8'
    }`;

  return (
    <motion.div
      layout={!reduceMotion}
      transition={{ layout: { duration: 0.28, ease: EASE_DRAWER } }}
      className={`hidden md:flex p-2 ${
        expanded
          ? 'flex-1 min-w-0'
          : 'shrink-0 md:pr-4 w-[min(100%,calc(420px+3.5rem+1rem))] max-w-[55vw]'
      }`}
    >
      <div
        className={`w-full h-full flex rounded-2xl overflow-hidden backdrop-blur-3xl ${
          isDarkMode ? 'text-gray-100' : 'text-gray-900'
        }`}
        style={{ backgroundColor: getGlassSurface(accentColor, isDarkMode) }}
      >
        {/* Logo + view toggle / back + avatar rail */}
        <div className="w-14 shrink-0 flex flex-col items-center py-3 gap-1">
          <button
            type="button"
            onClick={onOpenAbout}
            className={`flex items-center justify-center size-9 rounded-lg transition-colors pressable ${
              isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'
            }`}
            aria-label="About tsk"
            title="About tsk"
          >
            <img className="w-5 h-5" src="/tsk-logo.png" alt="tsk logo" />
          </button>

          <div className="flex-1 flex items-center justify-center min-h-0">
            <AnimatePresence initial={false} mode="wait">
              {expanded && onBack ? (
                <motion.button
                  key="back"
                  type="button"
                  onClick={onBack}
                  initial={reduceMotion ? false : { opacity: 0, transform: 'scale(0.96)' }}
                  animate={{ opacity: 1, transform: 'scale(1)' }}
                  exit={reduceMotion ? undefined : { opacity: 0, transform: 'scale(0.96)' }}
                  transition={{ duration: 0.18, ease: EASE_DRAWER }}
                  className={`pressable flex items-center justify-center size-9 rounded-lg transition-colors ${
                    isDarkMode
                      ? 'text-white/70 hover:text-white hover:bg-white/10'
                      : 'text-black/55 hover:text-black/80 hover:bg-black/5'
                  }`}
                  aria-label="Back to home"
                  title="Back"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </motion.button>
              ) : !expanded ? (
                <motion.div
                  key="view-toggle"
                  role="group"
                  aria-label="Schedule view"
                  initial={reduceMotion ? false : { opacity: 0, transform: 'scale(0.96)' }}
                  animate={{ opacity: 1, transform: 'scale(1)' }}
                  exit={reduceMotion ? undefined : { opacity: 0, transform: 'scale(0.96)' }}
                  transition={{ duration: 0.18, ease: EASE_DRAWER }}
                  className={`flex flex-col items-center gap-0.5 p-1 rounded-xl ${
                    isDarkMode ? 'bg-white/[0.06]' : 'bg-black/[0.06]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onViewModeChange('agenda')}
                    className={iconBtn(viewMode === 'agenda')}
                    aria-label="Agenda view"
                    title="Agenda view"
                    aria-pressed={viewMode === 'agenda'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => onViewModeChange('timeline')}
                    className={iconBtn(viewMode === 'timeline')}
                    aria-label="Timeline view"
                    title="Timeline view"
                    aria-pressed={viewMode === 'timeline'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center size-9">
            <UserMenu trigger="avatar" showSyncBadge allowAddAccount menuItems={userMenuItems} />
          </div>
        </div>

        {/* Subtle vertical divider */}
        <div
          className={`w-px shrink-0 self-stretch my-3 ${
            isDarkMode ? 'bg-white/5' : 'bg-black/12'
          }`}
          aria-hidden
        />

        {/* Calendar / agenda / settings content */}
        <div className="flex-1 min-w-0 h-full relative">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={expanded ? 'settings' : 'schedule'}
              className="h-full w-full"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.18, ease: EASE_DRAWER }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default DesktopSidePanel;
