import { type Dispatch, type SetStateAction, useEffect } from "react";
import { Task } from "../utils/types";
import { ScheduleCardData } from "../utils/schedule";
import { IslandMode } from "./useHomeUiState";

interface UseHomeKeyboardShortcutsOptions {
  activeFolder: string | null;
  filteredTasks: Task[];
  folders: { id: string }[];
  handleEnterFocus: (task: Task) => void | Promise<void>;
  handleEventSelect: (event: ScheduleCardData | null) => void;
  isMobile: boolean;
  islandMode: IslandMode;
  scheduleEvents: ScheduleCardData[];
  selectedEvent: ScheduleCardData | null;
  selectedTask: Task | null;
  setActiveFolder: Dispatch<SetStateAction<string | null>>;
  setAboutModalOpen: Dispatch<SetStateAction<boolean>>;
  setCurrentView: Dispatch<SetStateAction<"home" | "settings">>;
  setDrawerOpen: Dispatch<SetStateAction<boolean>>;
  setIslandMode: Dispatch<SetStateAction<IslandMode>>;
  setSelectedEvent: Dispatch<SetStateAction<ScheduleCardData | null>>;
  setSelectedTask: Dispatch<SetStateAction<Task | null>>;
  showAllFolder: boolean;
  showOtherFolder: boolean;
  showTodayFolder: boolean;
}

const isInputFocused = () => {
  const activeElement = document.activeElement;
  return activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement;
};

export function useHomeKeyboardShortcuts({
  activeFolder,
  filteredTasks,
  folders,
  handleEnterFocus,
  handleEventSelect,
  isMobile,
  islandMode,
  scheduleEvents,
  selectedEvent,
  selectedTask,
  setActiveFolder,
  setAboutModalOpen,
  setCurrentView,
  setDrawerOpen,
  setIslandMode,
  setSelectedEvent,
  setSelectedTask,
  showAllFolder,
  showOtherFolder,
  showTodayFolder,
}: UseHomeKeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const inputFocused = isInputFocused();

      if (!inputFocused) {
        if (event.key === "t") {
          event.preventDefault();
          setIslandMode("task");
          return;
        }

        if (event.key === "e") {
          event.preventDefault();
          setIslandMode("event");
          return;
        }

        if (event.key === "/") {
          event.preventDefault();
          setIslandMode((currentMode) => (currentMode === "command" ? "default" : "command"));
          return;
        }

        if (event.key === " " && selectedTask) {
          event.preventDefault();
          void handleEnterFocus(selectedTask);
          return;
        }
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setSelectedTask(null);
        setSelectedEvent(null);
        setCurrentView("home");
        setAboutModalOpen(false);
        setIslandMode("default");
        if (isMobile) {
          setDrawerOpen(false);
        }
        return;
      }

      if (event.key === "Tab" && !inputFocused && islandMode === "default" && !selectedTask && !selectedEvent) {
        event.preventDefault();

        const folderIds = [
          ...(showAllFolder ? ["all"] : []),
          ...folders.map((folder) => folder.id),
          ...(showOtherFolder ? ["other"] : []),
          ...(showTodayFolder ? ["today"] : []),
        ];

        if (folderIds.length === 0) {
          return;
        }

        const currentFolder = activeFolder || (showAllFolder ? "all" : folderIds[0]);
        const currentIndex = folderIds.indexOf(currentFolder);
        const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % folderIds.length : 0;

        setActiveFolder(folderIds[nextIndex]);
        return;
      }

      if (scheduleEvents.length > 0 && (event.key === "ArrowUp" || event.key === "ArrowDown") && !inputFocused) {
        event.preventDefault();

        const sortedEvents = [...scheduleEvents].sort((firstEvent, secondEvent) => {
          const firstStart = firstEvent.start.dateTime ? new Date(firstEvent.start.dateTime).getTime() : 0;
          const secondStart = secondEvent.start.dateTime ? new Date(secondEvent.start.dateTime).getTime() : 0;
          return firstStart - secondStart;
        });

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const todaysEvents = sortedEvents.filter((scheduledEvent) => {
          if (!scheduledEvent.start.dateTime) {
            return false;
          }

          const eventDate = new Date(scheduledEvent.start.dateTime);
          return eventDate >= startOfDay && eventDate <= endOfDay;
        });

        if (todaysEvents.length === 0) {
          return;
        }

        const currentIndex = selectedEvent ? todaysEvents.findIndex((scheduledEvent) => scheduledEvent.id === selectedEvent.id) : -1;
        const newIndex =
          event.key === "ArrowDown"
            ? currentIndex < todaysEvents.length - 1
              ? currentIndex + 1
              : 0
            : currentIndex > 0
              ? currentIndex - 1
              : todaysEvents.length - 1;

        handleEventSelect(todaysEvents[newIndex]);
        return;
      }

      if (filteredTasks.length > 0 && (event.key === "ArrowRight" || event.key === "ArrowLeft") && !inputFocused) {
        event.preventDefault();

        const currentIndex = selectedTask ? filteredTasks.findIndex((task) => task.id === selectedTask.id) : -1;
        const newIndex =
          event.key === "ArrowRight"
            ? currentIndex < filteredTasks.length - 1
              ? currentIndex + 1
              : 0
            : currentIndex > 0
              ? currentIndex - 1
              : filteredTasks.length - 1;

        setSelectedTask(filteredTasks[newIndex]);
        setSelectedEvent(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activeFolder,
    filteredTasks,
    folders,
    handleEnterFocus,
    handleEventSelect,
    isMobile,
    islandMode,
    scheduleEvents,
    selectedEvent,
    selectedTask,
    setActiveFolder,
    setAboutModalOpen,
    setCurrentView,
    setDrawerOpen,
    setIslandMode,
    setSelectedEvent,
    setSelectedTask,
    showAllFolder,
    showOtherFolder,
    showTodayFolder,
  ]);
}
