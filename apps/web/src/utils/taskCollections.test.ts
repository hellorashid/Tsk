import { describe, expect, it } from "vitest";
import { getCompletedTasks, getFilteredTasks, getSuggestedTasks, isTaskScheduledOnDate } from "./taskCollections";
import type { Folder, Task } from "./types";
import type { ScheduleCardData } from "./schedule";

const baseTasks: Task[] = [
  { id: "1", name: "Inbox", description: "", completed: false },
  { id: "2", name: "Work item", description: "", completed: false, labels: "folder:work,client" },
  { id: "3", name: "Completed work", description: "", completed: true, labels: "folder:work" },
  { id: "4", name: "Recent scheduled", description: "", completed: false },
  { id: "5", name: "Scheduled today", description: "", completed: false },
  { id: "6", name: "Child task", description: "", completed: false, parentTaskId: "1" },
];

const folders: Folder[] = [
  { id: "work-folder", name: "work", labels: "folder:work", color: "#111111" },
];

const makeEvent = (overrides: Partial<ScheduleCardData>): ScheduleCardData => ({
  id: "event-id",
  title: "Event",
  start: { dateTime: "2026-07-07T10:00:00.000Z" },
  end: { dateTime: "2026-07-07T10:30:00.000Z" },
  color: "#000000",
  type: "task",
  taskId: "1",
  ...overrides,
});

describe("taskCollections", () => {
  it("filters top-level tasks for all and folder views", () => {
    const scheduleEvents: ScheduleCardData[] = [];

    expect(
      getFilteredTasks({
        tasks: baseTasks,
        activeFolder: "all",
        scheduleEvents,
        folders,
      }).map((task) => task.id),
    ).toEqual(["1", "2", "4", "5"]);

    expect(
      getFilteredTasks({
        tasks: baseTasks,
        activeFolder: "work-folder",
        scheduleEvents,
        folders,
      }).map((task) => task.id),
    ).toEqual(["2"]);

    expect(
      getFilteredTasks({
        tasks: baseTasks,
        activeFolder: "other",
        scheduleEvents,
        folders,
      }).map((task) => task.id),
    ).toEqual(["1", "4", "5"]);
  });

  it("identifies tasks scheduled for a specific day", () => {
    const scheduleEvents = [
      makeEvent({
        taskId: "5",
        start: { dateTime: "2026-07-07T09:00:00.000Z" },
        end: { dateTime: "2026-07-07T09:30:00.000Z" },
      }),
    ];

    expect(isTaskScheduledOnDate(baseTasks[4], scheduleEvents, new Date("2026-07-07T12:00:00.000Z"))).toBe(true);
    expect(isTaskScheduledOnDate(baseTasks[0], scheduleEvents, new Date("2026-07-07T12:00:00.000Z"))).toBe(false);
  });

  it("builds today suggestions from recent history and unscheduled tasks", () => {
    const now = new Date("2026-07-07T12:00:00.000Z");
    const scheduleEvents: ScheduleCardData[] = [
      makeEvent({
        id: "recent",
        taskId: "4",
        start: { dateTime: "2026-07-05T10:00:00.000Z" },
        end: { dateTime: "2026-07-05T10:30:00.000Z" },
      }),
      makeEvent({
        id: "today",
        taskId: "5",
        start: { dateTime: "2026-07-07T14:00:00.000Z" },
        end: { dateTime: "2026-07-07T14:30:00.000Z" },
      }),
    ];

    expect(
      getSuggestedTasks({
        tasks: baseTasks,
        activeFolder: "today",
        scheduleEvents,
        now,
      }).map((task) => task.id),
    ).toEqual(["4", "1", "2"]);
  });

  it("filters completed tasks by folder and today", () => {
    const todayStart = new Date();
    todayStart.setHours(14, 0, 0, 0);

    const scheduleEvents: ScheduleCardData[] = [
      makeEvent({
        id: "completed-today",
        taskId: "3",
        start: { dateTime: todayStart.toISOString() },
        end: { dateTime: new Date(todayStart.getTime() + 30 * 60 * 1000).toISOString() },
      }),
    ];

    expect(
      getCompletedTasks({
        tasks: baseTasks,
        activeFolder: "work-folder",
        scheduleEvents,
        folders,
      }).map((task) => task.id),
    ).toEqual(["3"]);

    expect(
      getCompletedTasks({
        tasks: baseTasks,
        activeFolder: "today",
        scheduleEvents,
        folders,
      }).map((task) => task.id),
    ).toEqual(["3"]);
  });
});
