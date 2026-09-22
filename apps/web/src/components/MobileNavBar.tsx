import { UserMenu, type UserMenuItem } from "@basictech/react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, type ReactNode } from "react";
import { useTheme, getGlassSurface } from "../contexts/ThemeContext";

export type MobileNavTarget = "tasks" | "agenda" | "calendar";

interface MobileNavBarProps {
  currentView: "tasks" | "calendar";
  scheduleViewMode: "timeline" | "agenda";
  onViewChange: (view: MobileNavTarget) => void;
  onCreateNew: () => void;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  isCloseMode?: boolean;
  onClose?: () => void;
}

const TasksIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const AgendaIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeWidth={2} d="M6 6l12 12M18 6L6 18" />
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const AboutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

function getGlassStyle(accentColor: string, isDarkMode: boolean) {
  return {
    backgroundColor: getGlassSurface(accentColor, isDarkMode),
    borderColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
    boxShadow: isDarkMode ? "0 8px 32px rgba(0, 0, 0, 0.3)" : "0 8px 32px rgba(0, 0, 0, 0.12)",
  };
}

interface NavIconButtonProps {
  label: string;
  isActive?: boolean;
  isDarkMode: boolean;
  onClick: () => void;
  children: ReactNode;
}

const NavIconButton = ({ label, isActive = false, isDarkMode, onClick, children }: NavIconButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`pressable flex items-center justify-center w-12 h-12 rounded-full transition-colors duration-200 ${
      isActive
        ? isDarkMode
          ? "bg-white/20 text-white"
          : "bg-gray-800 text-white"
        : isDarkMode
          ? "text-gray-300 hover:bg-white/10"
          : "text-gray-600 hover:bg-gray-100"
    }`}
    aria-label={label}
    aria-current={isActive ? "page" : undefined}
  >
    {children}
  </button>
);

function MobileNavBar({
  currentView,
  scheduleViewMode,
  onViewChange,
  onCreateNew,
  onOpenSettings,
  onOpenAbout,
  isCloseMode = false,
  onClose,
}: MobileNavBarProps) {
  const { theme } = useTheme();
  const { accentColor, isDarkMode } = theme;
  const glassStyle = getGlassStyle(accentColor, isDarkMode);
  const leftInset = "max(1.25rem, calc(env(safe-area-inset-left, 0px) + 1.25rem))";
  const rightInset = "max(1.25rem, calc(env(safe-area-inset-right, 0px) + 1.25rem))";

  const userMenuItems = useMemo<UserMenuItem[]>(() => [
    {
      id: "settings",
      label: "Settings",
      onClick: onOpenSettings,
      icon: <SettingsIcon />,
    },
    {
      id: "about",
      label: "About tsk",
      onClick: onOpenAbout,
      icon: <AboutIcon />,
    },
  ], [onOpenAbout, onOpenSettings]);

  const tasksActive = currentView === "tasks";
  const agendaActive = currentView === "calendar" && scheduleViewMode === "agenda";
  const calendarActive = currentView === "calendar" && scheduleViewMode === "timeline";

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)",
      }}
    >
      <div
        className="relative mb-2"
        style={{ paddingLeft: leftInset, paddingRight: rightInset }}
      >
        <div className="flex items-center justify-between gap-3">
          <div
            className="flex items-center justify-center gap-1 px-2 py-2 rounded-full backdrop-blur-3xl shadow-lg border min-w-0"
            style={glassStyle}
            role="navigation"
            aria-label="Primary"
          >
            <div className="flex items-center justify-center w-12 h-12 shrink-0">
              <UserMenu trigger="avatar" showSyncBadge showInvites allowAddAccount menuItems={userMenuItems} />
            </div>

            <NavIconButton
              label="Tasks"
              isActive={tasksActive}
              isDarkMode={isDarkMode}
              onClick={() => onViewChange("tasks")}
            >
              <TasksIcon />
            </NavIconButton>

            <NavIconButton
              label="Agenda"
              isActive={agendaActive}
              isDarkMode={isDarkMode}
              onClick={() => onViewChange("agenda")}
            >
              <AgendaIcon />
            </NavIconButton>

            <NavIconButton
              label="Calendar"
              isActive={calendarActive}
              isDarkMode={isDarkMode}
              onClick={() => onViewChange("calendar")}
            >
              <CalendarIcon />
            </NavIconButton>
          </div>

          <div
            className="flex items-center justify-center px-2 py-2 rounded-full backdrop-blur-3xl shadow-lg border shrink-0"
            style={glassStyle}
          >
            <button
              type="button"
              onClick={() => {
                if (isCloseMode) {
                  onClose?.();
                  return;
                }
                onCreateNew();
              }}
              className={`pressable flex items-center justify-center w-12 h-12 rounded-full transition-colors duration-200 ${
                isDarkMode ? "text-gray-300 hover:bg-white/10" : "text-gray-600 hover:bg-gray-100"
              }`}
              aria-label={isCloseMode ? "Close settings" : "Create new"}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={isCloseMode ? "close" : "new"}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.08 }}
                  className="flex"
                >
                  {isCloseMode ? <CloseIcon /> : <PlusIcon />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MobileNavBar;
