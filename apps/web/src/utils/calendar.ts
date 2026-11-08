import { getStartOfDay } from "./dateHelpers";
import { parseDateOnlyValue, type ScheduleCardData } from "./schedule";
import type { Task } from "./types";

const MINUTES_PER_DAY = 24 * 60;
/** Shortest block the week grid draws, so brief events stay tappable. */
export const MIN_EVENT_BLOCK_MINUTES = 24;
/** Stand-in length for events saved with no usable end time. */
const FALLBACK_DURATION_MS = 30 * 60_000;

const pad = (value: number) => value.toString().padStart(2, "0");

/** yyyy-mm-dd in local time. `toISOString` would roll evening dates into tomorrow. */
export const toDateInputValue = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const toTimeInputValue = (date: Date): string => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

export const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const isSameDay = (a: Date, b: Date): boolean => a.toDateString() === b.toDateString();

export const getStartOfWeek = (date: Date): Date => addDays(getStartOfDay(date), -date.getDay());

/** Moves by whole months, landing on the last day when the target month is shorter. */
export const shiftMonth = (date: Date, months: number): Date => {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), lastDay));
  return target;
};

/** Every date shown in a Sunday-first month grid, including neighbouring months' days. */
export const getMonthGridDays = (date: Date): Date[] => {
  const first = getStartOfWeek(new Date(date.getFullYear(), date.getMonth(), 1));
  const last = addDays(getStartOfWeek(new Date(date.getFullYear(), date.getMonth() + 1, 0)), 6);
  const days: Date[] = [];
  for (let day = first; day <= last; day = addDays(day, 1)) {
    days.push(day);
  }
  return days;
};

/** Sunrise, sunset and weather rows: context for the day, not plans in it. */
export const isAmbientEvent = (event: Pick<ScheduleCardData, "type">): boolean =>
  event.type === "weather" || event.type === "sunrise" || event.type === "sunset";

export const isAllDayEvent = (event: Pick<ScheduleCardData, "start">): boolean =>
  !event.start.dateTime && Boolean(event.start.date);

export interface EventRange {
  start: Date;
  /** Exclusive. Always after `start`, even for rows saved with a bad end. */
  end: Date;
}

export const getEventRange = (event: Pick<ScheduleCardData, "start" | "end">): EventRange | null => {
  if (event.start.dateTime) {
    const start = new Date(event.start.dateTime);
    const end = event.end.dateTime ? new Date(event.end.dateTime) : null;
    return { start, end: end && end > start ? end : new Date(start.getTime() + FALLBACK_DURATION_MS) };
  }

  if (event.start.date) {
    const start = parseDateOnlyValue(event.start.date);
    if (!start) {
      return null;
    }
    // All-day ends are exclusive; a missing or equal end still means one full day.
    const end = event.end.date ? parseDateOnlyValue(event.end.date) : null;
    return { start, end: end && end > start ? end : addDays(start, 1) };
  }

  return null;
};

export const isEventOnDay = (event: Pick<ScheduleCardData, "start" | "end">, day: Date): boolean => {
  const range = getEventRange(event);
  if (!range) {
    return false;
  }
  const dayStart = getStartOfDay(day);
  return range.start < addDays(dayStart, 1) && range.end > dayStart;
};

export interface PositionedEvent {
  event: ScheduleCardData;
  /** Minutes from midnight, clipped to this day. */
  top: number;
  height: number;
  lane: number;
  laneCount: number;
}

/** Places a day's timed events, sharing width between events that overlap. */
export const layoutTimedEvents = (events: ScheduleCardData[], day: Date): PositionedEvent[] => {
  const dayStart = getStartOfDay(day);
  const nextDay = addDays(dayStart, 1);

  const placed = events
    .flatMap((event) => {
      const range = getEventRange(event);
      if (!range || isAllDayEvent(event) || !isEventOnDay(event, day)) {
        return [];
      }
      const startMinutes = range.start < dayStart ? 0 : range.start.getHours() * 60 + range.start.getMinutes();
      const endMinutes =
        range.end >= nextDay ? MINUTES_PER_DAY : range.end.getHours() * 60 + range.end.getMinutes();
      const top = Math.min(startMinutes, MINUTES_PER_DAY - MIN_EVENT_BLOCK_MINUTES);
      return [{ event, top, height: Math.max(endMinutes - top, MIN_EVENT_BLOCK_MINUTES), lane: 0, laneCount: 1 }];
    })
    .sort((a, b) => a.top - b.top || b.height - a.height);

  let cluster: PositionedEvent[] = [];
  let clusterEnd = -1;
  const closeCluster = () => {
    const laneCount = Math.max(1, ...cluster.map((item) => item.lane + 1));
    cluster.forEach((item) => {
      item.laneCount = laneCount;
    });
    cluster = [];
  };

  for (const item of placed) {
    if (item.top >= clusterEnd) {
      closeCluster();
      clusterEnd = -1;
    }
    const taken = new Set(
      cluster.filter((other) => other.top + other.height > item.top).map((other) => other.lane),
    );
    while (taken.has(item.lane)) {
      item.lane += 1;
    }
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.top + item.height);
  }
  closeCluster();

  return placed;
};

export type EventKind = "event" | "task" | "done";

export const getEventPresentation = (
  event: ScheduleCardData,
  tasks: Task[],
): { title: string; kind: EventKind } => {
  if (event.type === "task:completed") {
    return { title: event.title, kind: "done" };
  }
  if (event.type === "task") {
    const task = event.taskId ? tasks.find((candidate) => candidate.id === event.taskId) : undefined;
    return { title: task?.name || event.title, kind: task?.completed ? "done" : "task" };
  }
  return { title: event.title, kind: "event" };
};

/** Next full hour on today, or a morning default on any other day. */
export const getDefaultSlot = (day: Date, now = new Date()): { startTime: string; endTime: string } => {
  const hour = isSameDay(day, now) ? Math.min(now.getHours() + 1, 23) : 9;
  return { startTime: `${pad(hour)}:00`, endTime: `${pad((hour + 1) % 24)}:00` };
};

export type ResolvedEventTimes = { start: Date; end: Date } | { error: string };

/** Turns the popover's fields into a range. An end of 00:00 means the following midnight. */
export const resolveEventTimes = ({
  date,
  startTime,
  endTime,
  endDayOffset = 0,
}: {
  date: string;
  startTime: string;
  endTime: string;
  endDayOffset?: number;
}): ResolvedEventTimes => {
  const start = new Date(`${date}T${startTime}`);
  if (!date || !startTime || !endTime || Number.isNaN(start.getTime())) {
    return { error: "Add a date and time." };
  }

  const offset = endDayOffset === 0 && endTime === "00:00" ? 1 : endDayOffset;
  const end = addDays(new Date(`${date}T${endTime}`), offset);
  if (end <= start) {
    return { error: "End time must be after the start." };
  }

  return { start, end };
};

export const formatClockTime = (time: string): string => {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${pad(minutes)} ${suffix}`;
};
