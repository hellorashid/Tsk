import { useBasic } from "@basictech/react";
import { type Dispatch, type SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { useBasicDbReady } from "./useBasicDbReady";
import { Folder, FolderUpdate, Task, TaskUpdate } from "../utils/types";
import { fetchWeatherData } from "../utils/weather";
import { ScheduleCardData, ScheduleCardInput, ScheduleCardUpdate } from "../utils/schedule";

interface ThemeLocation {
  latitude: number;
  longitude: number;
}

interface UseAppActionsOptions {
  activeFolder: string | null;
  folders: Folder[];
  scheduleEvents: ScheduleCardData[];
  selectedTask: Task | null;
  setActiveFolder: Dispatch<SetStateAction<string | null>>;
  setDrawerOpen: Dispatch<SetStateAction<boolean>>;
  setIsNewTaskMode: Dispatch<SetStateAction<boolean>>;
  setSelectedEvent: Dispatch<SetStateAction<ScheduleCardData | null>>;
  setSelectedTask: Dispatch<SetStateAction<Task | null>>;
  themeLocation: ThemeLocation;
}

const getResolvedTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export function useAppActions({
  activeFolder,
  folders,
  scheduleEvents,
  selectedTask,
  setActiveFolder,
  setDrawerOpen,
  setIsNewTaskMode,
  setSelectedEvent,
  setSelectedTask,
  themeLocation,
}: UseAppActionsOptions) {
  const { db } = useBasic();
  const isDbReady = useBasicDbReady();
  const scheduleTable = db.table<ScheduleCardData>("schedule");
  const tasksTable = db.table<Task>("tasks");
  const filtersTable = db.table<Folder>("filters");
  const [focusedTask, setFocusedTask] = useState<Task | null>(null);
  const [focusSessionEventId, setFocusSessionEventId] = useState<string | null>(null);
  const fetchingWeatherDatesRef = useRef<Set<string>>(new Set());

  const updateScheduleEvent = useCallback(
    async (id: string, changes: ScheduleCardUpdate) => {
      if (!isDbReady) {
        return;
      }

      await scheduleTable.patch(id, changes);
    },
    [isDbReady, scheduleTable],
  );

  const deleteScheduleEvent = useCallback(
    async (id: string) => {
      if (!isDbReady) {
        return;
      }

      await scheduleTable.delete(id);
    },
    [isDbReady, scheduleTable],
  );

  const handleEnterFocus = useCallback(
    async (task: Task) => {
      if (!isDbReady) {
        return;
      }

      setFocusedTask(task);
      setSelectedTask(null);
      setSelectedEvent(null);
      setDrawerOpen(false);

      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      const existingTodayEvent = scheduleEvents.find((event) => {
        if (event.type !== "task" || event.taskId !== task.id || !event.start.dateTime) {
          return false;
        }

        const eventStart = new Date(event.start.dateTime);
        const eventEnd = event.end.dateTime ? new Date(event.end.dateTime) : eventStart;
        const isScheduledForToday = eventStart >= todayStart && eventStart <= todayEnd;

        return isScheduledForToday && eventEnd >= now;
      });

      const timeZone = getResolvedTimeZone();

      if (existingTodayEvent) {
        await scheduleTable.patch(existingTodayEvent.id, {
          title: `${task.name} (focus session)`,
          start: {
            dateTime: now.toISOString(),
            timeZone,
          },
          end: {
            dateTime: now.toISOString(),
            timeZone,
          },
          description: "Focus session",
        });
        setFocusSessionEventId(existingTodayEvent.id);
        return;
      }

      const eventRecord = await scheduleTable.create({
        title: `${task.name} (focus session)`,
        start: {
          dateTime: now.toISOString(),
          timeZone,
        },
        end: {
          dateTime: now.toISOString(),
          timeZone,
        },
        color: "rgba(148, 163, 184, 0.08)",
        type: "task" as const,
        taskId: task.id,
        description: "Focus session",
      });

      setFocusSessionEventId(eventRecord.id);
    },
    [isDbReady, scheduleEvents, scheduleTable, setDrawerOpen, setSelectedEvent, setSelectedTask],
  );

  const handleExitFocus = useCallback(async () => {
    if (!isDbReady) {
      setFocusSessionEventId(null);
      setFocusedTask(null);
      return;
    }

    if (focusSessionEventId) {
      const now = new Date();
      await scheduleTable.patch(focusSessionEventId, {
        end: {
          dateTime: now.toISOString(),
          timeZone: getResolvedTimeZone(),
        },
      });
      setFocusSessionEventId(null);
    }

    setFocusedTask(null);
  }, [focusSessionEventId, isDbReady, scheduleTable]);

  const handleFetchWeather = useCallback(
    async (date: Date) => {
      if (!isDbReady) {
        return;
      }

      const dateKey = date.toDateString();

      if (fetchingWeatherDatesRef.current.has(dateKey)) {
        return;
      }

      const existingWeather = scheduleEvents.find((event) => {
        if (event.type !== "weather" || !event.start.dateTime) {
          return false;
        }

        return new Date(event.start.dateTime).toDateString() === dateKey;
      });

      if (existingWeather) {
        return;
      }

      fetchingWeatherDatesRef.current.add(dateKey);

      try {
        const weatherData = await fetchWeatherData(themeLocation.latitude, themeLocation.longitude, date);
        const timeZone = getResolvedTimeZone();
        const middayDate = new Date(date);
        middayDate.setHours(12, 0, 0, 0);

        await Promise.all([
          scheduleTable.create({
            title: "Weather",
            start: {
              dateTime: middayDate.toISOString(),
              timeZone,
            },
            end: {
              dateTime: middayDate.toISOString(),
              timeZone,
            },
            color: "rgba(148, 163, 184, 0.05)",
            type: "weather" as const,
            description: weatherData.condition,
            metadata: {
              weather: {
                temperature: weatherData.temperature,
                condition: weatherData.condition,
                sunrise: weatherData.sunrise,
                sunset: weatherData.sunset,
                fetchedAt: new Date().toISOString(),
                hourlyTemperatures: weatherData.hourlyTemperatures,
              },
            },
          }),
          scheduleTable.create({
            title: "Sunrise",
            start: {
              dateTime: new Date(weatherData.sunrise).toISOString(),
              timeZone,
            },
            end: {
              dateTime: new Date(weatherData.sunrise).toISOString(),
              timeZone,
            },
            color: "rgba(251, 146, 60, 0.15)",
            type: "sunrise" as const,
            description: "Sunrise",
          }),
          scheduleTable.create({
            title: "Sunset",
            start: {
              dateTime: new Date(weatherData.sunset).toISOString(),
              timeZone,
            },
            end: {
              dateTime: new Date(weatherData.sunset).toISOString(),
              timeZone,
            },
            color: "rgba(249, 115, 22, 0.15)",
            type: "sunset" as const,
            description: "Sunset",
          }),
        ]);
      } catch (error) {
        console.error("Failed to fetch weather:", error);
      } finally {
        fetchingWeatherDatesRef.current.delete(dateKey);
      }
    },
    [isDbReady, scheduleEvents, scheduleTable, themeLocation.latitude, themeLocation.longitude],
  );

  useEffect(() => {
    if (!isDbReady) {
      return undefined;
    }

    const timer = setTimeout(() => {
      void handleFetchWeather(new Date());
    }, 3000);

    return () => clearTimeout(timer);
  }, [handleFetchWeather, isDbReady]);

  const findNextAvailableSlot = useCallback(
    (durationMinutes = 30): { start: Date; end: Date } => {
      const now = new Date();
      const roundedMinutes = Math.ceil(now.getMinutes() / 15) * 15;
      now.setMinutes(roundedMinutes, 0, 0);

      let candidateStart = new Date(now);
      let candidateEnd = new Date(candidateStart.getTime() + durationMinutes * 60 * 1000);

      for (let attempts = 0; attempts < 50; attempts += 1) {
        const hasConflict = scheduleEvents.some((event) => {
          if (!event.start.dateTime || !event.end.dateTime) {
            return false;
          }

          const eventStart = new Date(event.start.dateTime);
          const eventEnd = new Date(event.end.dateTime);
          return candidateStart < eventEnd && candidateEnd > eventStart;
        });

        if (!hasConflict) {
          return { start: candidateStart, end: candidateEnd };
        }

        candidateStart = new Date(candidateStart.getTime() + 15 * 60 * 1000);
        candidateEnd = new Date(candidateStart.getTime() + durationMinutes * 60 * 1000);
      }

      return { start: now, end: new Date(now.getTime() + durationMinutes * 60 * 1000) };
    },
    [scheduleEvents],
  );

  const handleAddToSchedule = useCallback(
    async (task: Task) => {
      if (!isDbReady) {
        return;
      }

      const { start, end } = findNextAvailableSlot(30);

      await scheduleTable.create({
        title: task.name || "Untitled Task",
        start: {
          dateTime: start.toISOString(),
          timeZone: getResolvedTimeZone(),
        },
        end: {
          dateTime: end.toISOString(),
          timeZone: getResolvedTimeZone(),
        },
        color: "rgba(148, 163, 184, 0.08)",
        type: "task" as const,
        taskId: task.id,
        description: task.description,
      });
    },
    [findNextAvailableSlot, isDbReady, scheduleTable],
  );

  const handleAddEvent = useCallback(
    async (eventData: ScheduleCardInput): Promise<ScheduleCardData> => {
      if (!isDbReady) {
        throw new Error("Basic database is not ready yet.");
      }

      return scheduleTable.create(eventData);
    },
    [isDbReady, scheduleTable],
  );

  const createTaskCompletionEvent = useCallback(
    async (task: Task) => {
      if (!isDbReady) {
        return;
      }

      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      const existingCompletionEvents = await scheduleTable.find((scheduleEvent) =>
        Boolean(
          scheduleEvent.type === "task:completed" &&
            scheduleEvent.taskId === task.id &&
            scheduleEvent.start.dateTime &&
            new Date(scheduleEvent.start.dateTime) >= todayStart &&
            new Date(scheduleEvent.start.dateTime) <= todayEnd,
        ),
      );

      const completionEventData: ScheduleCardInput = {
        title: task.name || "Untitled Task",
        start: {
          dateTime: now.toISOString(),
          timeZone: getResolvedTimeZone(),
        },
        end: {
          dateTime: now.toISOString(),
          timeZone: getResolvedTimeZone(),
        },
        color: "rgba(148, 163, 184, 0.08)",
        type: "task:completed",
        taskId: task.id,
        description: `Completed: ${task.name}`,
      };

      if (existingCompletionEvents.length > 0) {
        await scheduleTable.patch(existingCompletionEvents[0].id, completionEventData);
        return;
      }

      await scheduleTable.create(completionEventData);
    },
    [isDbReady, scheduleTable],
  );

  const updateTask = useCallback(
    async (taskId: string, changes: TaskUpdate) => {
      if (!isDbReady) {
        return;
      }

      if (changes.completed === true) {
        const task = await tasksTable.get(taskId);
        if (task && !task.completed) {
          await createTaskCompletionEvent(task);
        }
      }

      await tasksTable.patch(taskId, changes);
    },
    [createTaskCompletionEvent, isDbReady, tasksTable],
  );

  const handleTaskToggle = useCallback(
    (taskId: string, completed: boolean) => {
      void updateTask(taskId, { completed });
    },
    [updateTask],
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      if (!isDbReady) {
        return;
      }

      const scheduleItems = await scheduleTable.find((item) => item.taskId === taskId);

      if (scheduleItems.length > 0) {
        const task = await tasksTable.get(taskId);

        if (task) {
          const taskSnapshot = {
            id: taskId,
            name: task.name,
            description: task.description,
            completed: task.completed,
            deletedAt: Date.now(),
          };

          for (const item of scheduleItems) {
            await scheduleTable.patch(item.id, {
              taskId: "",
              metadata: {
                taskSnapshot,
              },
            });
          }
        }
      }

      await tasksTable.delete(taskId);

      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
      }
    },
    [isDbReady, scheduleTable, selectedTask?.id, setSelectedTask, tasksTable],
  );

  const handleAddTask = useCallback(
    async (taskName: string): Promise<string | null> => {
      if (!isDbReady) {
        return null;
      }

      let labels = "";
      if (activeFolder) {
        const selectedFolder = folders.find((folder) => folder.id === activeFolder);
        if (selectedFolder) {
          labels = `folder:${selectedFolder.name.toLowerCase()}`;
        }
      }

      const result = await tasksTable.create({
        name: taskName,
        description: "",
        completed: false,
        labels,
      });

      const taskId = result.id;

      if (activeFolder === "today" && taskId) {
        await handleAddToSchedule({
          id: taskId,
          name: taskName,
          description: "",
          completed: false,
          labels,
        });
      }

      return taskId ?? null;
    },
    [activeFolder, folders, handleAddToSchedule, isDbReady, tasksTable],
  );

  const handleAddSubtask = useCallback(
    async (parentTaskId: string, subtaskName: string): Promise<string | null> => {
      if (!isDbReady) {
        return null;
      }

      const result = await tasksTable.create({
        name: subtaskName,
        description: "",
        completed: false,
        parentTaskId,
      });

      return result.id ?? null;
    },
    [isDbReady, tasksTable],
  );

  const openNewTaskDrawer = useCallback(() => {
    setIsNewTaskMode(true);
    setSelectedTask(null);
    setSelectedEvent(null);
    setDrawerOpen(true);
  }, [setDrawerOpen, setIsNewTaskMode, setSelectedEvent, setSelectedTask]);

  const handleCreateFolder = useCallback(
    async (name: string, labels?: string, color?: string) => {
      if (!isDbReady) {
        return;
      }

      const folderLabel = `folder:${name.toLowerCase()}`;
      const allLabels = labels ? `${folderLabel},${labels}` : folderLabel;

      await filtersTable.create({
        name: name.toLowerCase(),
        labels: allLabels,
        color: color || "",
      });
    },
    [filtersTable, isDbReady],
  );

  const handleUpdateFolder = useCallback(
    async (folderId: string, update: FolderUpdate) => {
      if (!isDbReady) {
        return;
      }

      await filtersTable.patch(folderId, {
        name: update.name.toLowerCase(),
        labels: update.labels,
        color: update.color || "",
      });
    },
    [filtersTable, isDbReady],
  );

  const handleDeleteFolder = useCallback(
    async (folderId: string) => {
      if (!isDbReady) {
        return;
      }

      await filtersTable.delete(folderId);
      if (activeFolder === folderId) {
        setActiveFolder(null);
      }
    },
    [activeFolder, filtersTable, isDbReady, setActiveFolder],
  );

  return {
    createTaskCompletionEvent,
    deleteScheduleEvent,
    deleteTask,
    focusedTask,
    handleAddEvent,
    handleAddSubtask,
    handleAddTask,
    handleAddToSchedule,
    handleCreateFolder,
    handleDeleteFolder,
    handleEnterFocus,
    handleExitFocus,
    handleFetchWeather,
    handleTaskToggle,
    handleUpdateFolder,
    openNewTaskDrawer,
    setFocusedTask,
    updateScheduleEvent,
    updateTask,
  };
}
