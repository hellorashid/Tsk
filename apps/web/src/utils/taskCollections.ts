import { Folder, Task } from "./types";
import { ScheduleCardData, isEventScheduledOnDay } from "./schedule";

export const getTaskLabels = (task: Pick<Task, "labels">): string[] =>
  task.labels ? task.labels.split(",").map((label) => label.trim()).filter(Boolean) : [];

export const hasFolderLabel = (task: Pick<Task, "labels">): boolean =>
  getTaskLabels(task).some((label) => label.startsWith("folder:"));

export const isTaskInFolder = (task: Pick<Task, "labels">, folder: Pick<Folder, "labels">): boolean => {
  const folderLabels = folder.labels
    ? folder.labels.split(",").map((label) => label.trim()).filter(Boolean)
    : [];

  if (folderLabels.length === 0) {
    return true;
  }

  const taskLabels = getTaskLabels(task);

  return folderLabels.some((folderLabel) => taskLabels.includes(folderLabel));
};

export const isTaskScheduledOnDate = (
  task: Pick<Task, "id">,
  scheduleEvents: ScheduleCardData[],
  targetDate: Date,
): boolean =>
  scheduleEvents.some(
    (event) => event.type === "task" && event.taskId === task.id && isEventScheduledOnDay(event, targetDate),
  );

export const getTopLevelTasks = (tasks: Task[], completed: boolean): Task[] =>
  tasks.filter((task) => !task.parentTaskId && task.completed === completed);

export const getFilteredTasks = ({
  tasks,
  activeFolder,
  scheduleEvents,
  folders,
}: {
  tasks: Task[];
  activeFolder: string | null;
  scheduleEvents: ScheduleCardData[];
  folders: Folder[];
}): Task[] => {
  const topLevelTasks = getTopLevelTasks(tasks, false);

  if (activeFolder === null || activeFolder === "all") {
    return topLevelTasks;
  }

  if (activeFolder === "other") {
    return topLevelTasks.filter((task) => !hasFolderLabel(task));
  }

  if (activeFolder === "today") {
    const today = new Date();
    return topLevelTasks.filter((task) => isTaskScheduledOnDate(task, scheduleEvents, today));
  }

  const selectedFolder = folders.find((folder) => folder.id === activeFolder);
  if (!selectedFolder) {
    return topLevelTasks;
  }

  return topLevelTasks.filter((task) => isTaskInFolder(task, selectedFolder));
};

export const getSuggestedTasks = ({
  tasks,
  activeFolder,
  scheduleEvents,
  now = new Date(),
}: {
  tasks: Task[];
  activeFolder: string | null;
  scheduleEvents: ScheduleCardData[];
  now?: Date;
}): Task[] => {
  if (activeFolder !== "today") {
    return [];
  }

  const topLevelTasks = getTopLevelTasks(tasks, false);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const todayScheduledTaskIds = new Set(
    topLevelTasks.filter((task) => isTaskScheduledOnDate(task, scheduleEvents, today)).map((task) => task.id),
  );

  const pastWeekScheduledTasks = topLevelTasks.filter((task) => {
    if (todayScheduledTaskIds.has(task.id)) {
      return false;
    }

    return scheduleEvents.some((event) => {
      if (event.type !== "task" || event.taskId !== task.id) {
        return false;
      }

      const eventDayKey = event.start.dateTime ?? event.start.date;
      if (!eventDayKey) {
        return false;
      }

      const eventDate = new Date(eventDayKey);
      eventDate.setHours(0, 0, 0, 0);

      return eventDate.getTime() >= oneWeekAgo.getTime() && eventDate.getTime() < today.getTime();
    });
  });

  const unscheduledTasks = topLevelTasks.filter((task) => {
    if (todayScheduledTaskIds.has(task.id)) {
      return false;
    }

    return !scheduleEvents.some((event) => event.type === "task" && event.taskId === task.id);
  });

  const allSuggested = [...pastWeekScheduledTasks];
  const suggestedIds = new Set(allSuggested.map((task) => task.id));

  for (const task of unscheduledTasks) {
    if (!suggestedIds.has(task.id)) {
      allSuggested.push(task);
      suggestedIds.add(task.id);
    }
  }

  return allSuggested.slice(0, 5);
};

export const getCompletedTasks = ({
  tasks,
  activeFolder,
  scheduleEvents,
  folders,
}: {
  tasks: Task[];
  activeFolder: string | null;
  scheduleEvents: ScheduleCardData[];
  folders: Folder[];
}): Task[] => {
  const topLevelTasks = getTopLevelTasks(tasks, true);

  if (activeFolder === null || activeFolder === "all") {
    return topLevelTasks;
  }

  if (activeFolder === "other") {
    return topLevelTasks.filter((task) => !hasFolderLabel(task));
  }

  if (activeFolder === "today") {
    const today = new Date();
    return topLevelTasks.filter((task) => isTaskScheduledOnDate(task, scheduleEvents, today));
  }

  const selectedFolder = folders.find((folder) => folder.id === activeFolder);
  if (!selectedFolder) {
    return [];
  }

  return topLevelTasks.filter((task) => isTaskInFolder(task, selectedFolder));
};
