export type ScheduleEventType =
  | "event"
  | "task"
  | "task:completed"
  | "weather"
  | "sunrise"
  | "sunset"
  | "other";

export interface ScheduleDateValue {
  dateTime?: string;
  date?: string;
  timeZone?: string;
}

export interface DeletedTaskSnapshot {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  deletedAt: number;
}

export interface WeatherTemperaturePoint {
  time: string;
  temperature: number;
  weatherCode: number;
  condition: string;
}

export interface ScheduleWeatherMetadata {
  temperature: number;
  condition: string;
  sunrise: string;
  sunset: string;
  fetchedAt: string;
  hourlyTemperatures?: WeatherTemperaturePoint[];
}

export interface ScheduleMetadata {
  taskSnapshot?: DeletedTaskSnapshot;
  weather?: ScheduleWeatherMetadata;
}

export interface ScheduleCardData extends Record<string, unknown> {
  id: string;
  title: string;
  start: ScheduleDateValue;
  end: ScheduleDateValue;
  color: string;
  type?: ScheduleEventType;
  description?: string;
  taskId?: string;
  metadata?: ScheduleMetadata;
}

export type ScheduleCardInput = Omit<ScheduleCardData, "id">;
export type ScheduleCardUpdate = Partial<ScheduleCardInput>;

const toLocalMidnight = (year: number, month: number, day: number): Date => {
  const date = new Date();
  date.setFullYear(year, month, day);
  date.setHours(0, 0, 0, 0);
  return date;
};

const parseDateOnlyValue = (value: string): Date | null => {
  const [yearValue, monthValue, dayValue] = value.split("-").map(Number);
  if (!yearValue || !monthValue || !dayValue) {
    return null;
  }

  return toLocalMidnight(yearValue, monthValue - 1, dayValue);
};

export const getEventDuration = (event: Pick<ScheduleCardData, "start" | "end">): number => {
  if (!event.start.dateTime || !event.end.dateTime) {
    return 0;
  }

  const startDate = new Date(event.start.dateTime);
  const endDate = new Date(event.end.dateTime);

  return Math.round((endDate.getTime() - startDate.getTime()) / 60000);
};

export const getTimeFromDateTime = (dateTime: string): string => {
  const date = new Date(dateTime);
  const hours = date.getHours();
  const minutes = date.getMinutes();

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
};

export const minutesToDateTime = (minutes: number, baseDate?: Date): string => {
  const date = baseDate ? new Date(baseDate) : new Date();
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;

  date.setHours(hours, mins, 0, 0);

  return date.toISOString();
};

export const getEventDayKey = (event: Pick<ScheduleCardData, "start">): string | null => {
  if (event.start.dateTime) {
    const date = new Date(event.start.dateTime);
    date.setHours(0, 0, 0, 0);
    return date.toISOString();
  }

  if (event.start.date) {
    const date = parseDateOnlyValue(event.start.date);
    return date ? date.toISOString() : null;
  }

  return null;
};

export const isEventScheduledOnDay = (
  event: Pick<ScheduleCardData, "start">,
  targetDate: Date,
): boolean => {
  const eventDayKey = getEventDayKey(event);
  if (!eventDayKey) {
    return false;
  }

  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  return eventDayKey === target.toISOString();
};
