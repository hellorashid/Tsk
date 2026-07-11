import { useEffect, useRef, useState } from "react";

export type ViewMode = "compact" | "cozy" | "chonky";
export type MobileView = "tasks" | "calendar";
export type CurrentView = "home" | "settings";
export type ScheduleViewMode = "timeline" | "agenda";
export type IslandMode = "default" | "task" | "event" | "command";

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
    return saved === "null" ? null : saved;
  });
  const [folderDrawerOpen, setFolderDrawerOpen] = useState(false);
  const [folderSettingsOpen, setFolderSettingsOpen] = useState(false);
  const [showAllFolder, setShowAllFolder] = useState<boolean>(() => localStorage.getItem("tsk-show-all-folder") !== "false");
  const [showOtherFolder, setShowOtherFolder] = useState<boolean>(() => localStorage.getItem("tsk-show-other-folder") === "true");
  const [showTodayFolder, setShowTodayFolder] = useState<boolean>(() => localStorage.getItem("tsk-show-today-folder") !== "false");
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
    localStorage.setItem("tsk-show-all-folder", showAllFolder.toString());
  }, [showAllFolder]);

  useEffect(() => {
    localStorage.setItem("tsk-show-other-folder", showOtherFolder.toString());
  }, [showOtherFolder]);

  useEffect(() => {
    localStorage.setItem("tsk-show-today-folder", showTodayFolder.toString());
  }, [showTodayFolder]);

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
