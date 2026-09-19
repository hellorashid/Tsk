import { UserMenu, type UserMenuItem } from "@basictech/react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { basic } from "../basic";
import { useTheme } from "../contexts/ThemeContext";
import { useModalHistory } from "../hooks/useModalHistory";

interface MobileNavBarProps {
  currentView: "tasks" | "calendar";
  onViewChange: (view: "tasks" | "calendar") => void;
  onCreateNew: () => void;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  onOpenFolders: () => void;
  isCloseMode?: boolean;
  onClose?: () => void;
}

const TasksIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
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

const MenuTriggerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeWidth={2} d="M5 7h14M5 12h14M5 17h14" />
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

const FoldersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

function getGlassStyle(accentColor: string, isDarkMode: boolean) {
  return {
    backgroundColor: `${accentColor}E6`,
    borderColor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
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
    className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 ${
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

interface MenuRowProps {
  label: string;
  isDarkMode: boolean;
  onClick: () => void;
  children: ReactNode;
}

const MenuRow = ({ label, isDarkMode, onClick, children }: MenuRowProps) => (
  <button
    type="button"
    role="menuitem"
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-[15px] font-medium text-left transition-colors duration-150 ${
      isDarkMode
        ? "text-white/90 hover:bg-white/10"
        : "text-gray-800 hover:bg-black/5"
    }`}
  >
    <span className={isDarkMode ? "text-white/70" : "text-gray-500"}>{children}</span>
    {label}
  </button>
);

function MobileNavBar({
  currentView,
  onViewChange,
  onCreateNew,
  onOpenSettings,
  onOpenAbout,
  onOpenFolders,
  isCloseMode = false,
  onClose,
}: MobileNavBarProps) {
  const { theme } = useTheme();
  const { accentColor, isDarkMode } = theme;
  const { isSignedIn, isAnonymous, isReady, user, handle } = basic.useBasic();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const glassStyle = getGlassStyle(accentColor, isDarkMode);
  const leftInset = "max(1.25rem, calc(env(safe-area-inset-left, 0px) + 1.25rem))";
  const rightInset = "max(1.25rem, calc(env(safe-area-inset-right, 0px) + 1.25rem))";
  const isLocalAccount = isAnonymous || !isSignedIn;
  const accountName = !isReady
    ? "Account"
    : isLocalAccount
      ? "Local account"
      : user?.name || "Signed in";
  const accountSubtitle = !isReady
    ? "Checking…"
    : isLocalAccount
      ? "Sign in to sync"
      : handle
        ? `@${handle.replace(/^@/, "")}`
        : user?.email || "Manage account";

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useModalHistory(menuOpen, closeMenu, "mobile-nav-menu");

  const userMenuItems = useMemo<UserMenuItem[]>(() => [
    {
      id: "settings",
      label: "Settings",
      onClick: () => {
        setMenuOpen(false);
        onOpenSettings();
      },
      icon: <SettingsIcon />,
    },
    {
      id: "about",
      label: "About tsk",
      onClick: () => {
        setMenuOpen(false);
        onOpenAbout();
      },
      icon: <AboutIcon />,
    },
  ], [onOpenAbout, onOpenSettings]);

  useEffect(() => {
    if (isCloseMode && menuOpen) {
      setMenuOpen(false);
    }
  }, [isCloseMode, menuOpen]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      if (menuPanelRef.current?.contains(target) || menuButtonRef.current?.contains(target)) {
        return;
      }
      if (target.closest('[role="menu"], [role="dialog"], [data-base-ui-popup]')) {
        return;
      }
      setMenuOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const runAndClose = (action: () => void) => {
    setMenuOpen(false);
    action();
  };

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
        <AnimatePresence>
          {menuOpen && !isCloseMode ? (
            <motion.div
              ref={menuPanelRef}
              id={menuId}
              role="menu"
              aria-label="More"
              initial={{ opacity: 0, scale: 0.96, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 6 }}
              transition={{ duration: 0.08, ease: [0.32, 0.72, 0, 1] }}
              className="absolute bottom-full mb-2 w-[min(20rem,calc(100vw-2.5rem))] origin-bottom-right rounded-[28px] border backdrop-blur-3xl shadow-lg px-3 pt-3 pb-3"
              style={{ ...glassStyle, right: rightInset }}
            >
              <div className="flex justify-center pb-2">
                <div className={`w-8 h-1 rounded-full ${isDarkMode ? "bg-white/25" : "bg-black/15"}`} />
              </div>

              <div
                className={`flex items-center gap-3 px-2 py-2 mb-2 border-b ${
                  isDarkMode ? "border-white/10" : "border-black/10"
                }`}
              >
                <UserMenu trigger="avatar" showSyncBadge allowAddAccount menuItems={userMenuItems} />
                <div className="min-w-0 flex-1">
                  <p className={`text-[15px] font-medium truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    {accountName}
                  </p>
                  <p className={`text-xs truncate ${isDarkMode ? "text-white/50" : "text-gray-500"}`}>
                    {accountSubtitle}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-0.5">
                <MenuRow label="Settings" isDarkMode={isDarkMode} onClick={() => runAndClose(onOpenSettings)}>
                  <SettingsIcon />
                </MenuRow>
                <MenuRow label="About tsk" isDarkMode={isDarkMode} onClick={() => runAndClose(onOpenAbout)}>
                  <AboutIcon />
                </MenuRow>
                <MenuRow label="Folders" isDarkMode={isDarkMode} onClick={() => runAndClose(onOpenFolders)}>
                  <FoldersIcon />
                </MenuRow>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="flex items-center justify-between">
          <div
            className="flex items-center justify-center gap-5 px-2 py-2 rounded-full backdrop-blur-3xl shadow-lg border"
            style={glassStyle}
            role="navigation"
            aria-label="Primary"
          >
            <NavIconButton
              label="Tasks"
              isActive={currentView === "tasks"}
              isDarkMode={isDarkMode}
              onClick={() => onViewChange("tasks")}
            >
              <TasksIcon />
            </NavIconButton>
            <NavIconButton
              label="Calendar"
              isActive={currentView === "calendar"}
              isDarkMode={isDarkMode}
              onClick={() => onViewChange("calendar")}
            >
              <CalendarIcon />
            </NavIconButton>
            <NavIconButton
              label="Create new"
              isDarkMode={isDarkMode}
              onClick={onCreateNew}
            >
              <PlusIcon />
            </NavIconButton>
          </div>

          <div
            className="flex items-center justify-center px-2 py-2 rounded-full backdrop-blur-3xl shadow-lg border"
            style={glassStyle}
          >
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => {
                if (isCloseMode) {
                  onClose?.();
                  return;
                }
                setMenuOpen((open) => !open);
              }}
              className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors duration-200 ${
                isDarkMode ? "text-gray-300 hover:bg-white/10" : "text-gray-600 hover:bg-gray-100"
              }`}
              aria-label={isCloseMode ? "Close settings" : menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isCloseMode ? undefined : menuOpen}
              aria-controls={isCloseMode ? undefined : menuId}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={isCloseMode ? "close" : "menu"}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.08 }}
                  className="flex"
                >
                  {isCloseMode ? <CloseIcon /> : <MenuTriggerIcon />}
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
