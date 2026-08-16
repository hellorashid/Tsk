import { useEffect, useRef, useState } from "react";

export type ViewMode = "compact" | "cozy" | "chonky";
export type MobileView = "tasks" | "calendar";
export type CurrentView = "home" | "settings";
export type ScheduleViewMode = "timeline" | "agenda";
export type IslandMode = "default" | "task" | "event" | "command";

const FOLDER_PREF_VERSION = "v2";

function readLocalStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocalStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Throws in incognito, quota exceeded, or when storage is disabled
  }
}

function readFolderVisibility(key: string, defaultValue: boolean): boolean {
  const versioned = readLocalStorage(`${key}:${FOLDER_PREF_VERSION}`);
  if (versioned === "true") {
    return true;
  }
  if (versioned === "false") {
    return false;
  }
  return defaultValue;
}

export function useHomeUiState() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [viewMode, setViewMode] = useState<ViewMode>("cozy");
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [isNewTaskMode, setIsNewTaskMode] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>("tasks");
  const [currentView, setCurrentView] = useState<CurrentView>("home");
  const [scheduleViewMode, setScheduleViewMode] = useState<ScheduleViewMode>(() => {
    const saved = localStorage.getItem("tsk-schedule-view-mode");
    return saved === "timeline" || saved === "agenda" ? saved : "agenda";
  });
  const [islandMode, setIslandMode] = useState<IslandMode>("default");
  const [activeFolder, setActiveFolder] = useState<string | null>(() => {
    const saved = localStorage.getItem("tsk-active-folder");
    if (saved === null || saved === "null" || saved === "") {
      return "other";
    }
    return saved;
  });
  const [folderDrawerOpen, setFolderDrawerOpen] = useState(false);
  const [folderSettingsOpen, setFolderSettingsOpen] = useState(false);
  const [showAllFolder, setShowAllFolder] = useState<boolean>(() => readFolderVisibility("tsk-show-all-folder", false));
  const [showOtherFolder, setShowOtherFolder] = useState<boolean>(() => readFolderVisibility("tsk-show-other-folder", true));
  const [showTodayFolder, setShowTodayFolder] = useState<boolean>(() => readFolderVisibility("tsk-show-today-folder", true));
  const [suggestedTasksExpanded, setSuggestedTasksExpanded] = useState(false);
  const [completedTasksExpanded, setCompletedTasksExpanded] = useState(false);
  const hasSuggestedInitializedRef = useRef(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem("tsk-active-folder", activeFolder === null ? "null" : activeFolder);
  }, [activeFolder]);

  useEffect(() => {
    localStorage.setItem("tsk-schedule-view-mode", scheduleViewMode);
  }, [scheduleViewMode]);

  useEffect(() => {
    writeLocalStorage(`tsk-show-all-folder:${FOLDER_PREF_VERSION}`, showAllFolder.toString());
  }, [showAllFolder]);

  useEffect(() => {
    writeLocalStorage(`tsk-show-other-folder:${FOLDER_PREF_VERSION}`, showOtherFolder.toString());
  }, [showOtherFolder]);

  useEffect(() => {
    writeLocalStorage(`tsk-show-today-folder:${FOLDER_PREF_VERSION}`, showTodayFolder.toString());
  }, [showTodayFolder]);

  useEffect(() => {
    const isHiddenAll = (activeFolder === null || activeFolder === "all") && !showAllFolder;
    const isHiddenOther = activeFolder === "other" && !showOtherFolder;
    const isHiddenToday = activeFolder === "today" && !showTodayFolder;

    if (!isHiddenAll && !isHiddenOther && !isHiddenToday) {
      return;
    }

    if (showOtherFolder) {
      setActiveFolder("other");
      return;
    }
    if (showTodayFolder) {
      setActiveFolder("today");
      return;
    }
    if (showAllFolder) {
      setActiveFolder("all");
    }
  }, [activeFolder, showAllFolder, showOtherFolder, showTodayFolder]);

  return {
    activeFolder,
    aboutModalOpen,
    completedTasksExpanded,
    currentView,
    drawerOpen,
    folderDrawerOpen,
    folderSettingsOpen,
    hasSuggestedInitializedRef,
    islandMode,
    isMobile,
    isNewTaskMode,
    mobileView,
    scheduleViewMode,
    showAllFolder,
    showOtherFolder,
    showTodayFolder,
    suggestedTasksExpanded,
    viewMode,
    setActiveFolder,
    setAboutModalOpen,
    setCompletedTasksExpanded,
    setCurrentView,
    setDrawerOpen,
    setFolderDrawerOpen,
    setFolderSettingsOpen,
    setIslandMode,
    setIsNewTaskMode,
    setMobileView,
    setScheduleViewMode,
    setShowAllFolder,
    setShowOtherFolder,
    setShowTodayFolder,
    setSuggestedTasksExpanded,
    setViewMode,
  };
}
