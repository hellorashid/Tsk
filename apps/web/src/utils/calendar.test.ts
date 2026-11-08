import { describe, expect, it } from "vitest";
import {
  getDefaultSlot,
  getEventRange,
  getMonthGridDays,
  getStartOfWeek,
  isEventOnDay,
  layoutTimedEvents,
  resolveEventTimes,
  shiftMonth,
  toDateInputValue,
} from "./calendar";
import type { ScheduleCardData } from "./schedule";

const timed = (id: string, start: Date, end: Date): ScheduleCardData => ({
  id,
  title: id,
  color: "",
  start: { dateTime: start.toISOString() },
  end: { dateTime: end.toISOString() },
});

const at = (hour: number, minute = 0) => new Date(2026, 10, 7, hour, minute);
const day = new Date(2026, 10, 7);

describe("calendar date helpers", () => {
  it("formats input dates in local time late in the evening", () => {
    expect(toDateInputValue(new Date(2026, 10, 7, 23, 30))).toBe("2026-11-07");
  });

  it("anchors weeks to Sunday whichever day is selected", () => {
    expect(toDateInputValue(getStartOfWeek(new Date(2026, 10, 11)))).toBe("2026-11-08");
    expect(toDateInputValue(getStartOfWeek(new Date(2026, 10, 8)))).toBe("2026-11-08");
  });

  it("clamps month moves instead of skipping short months", () => {
    expect(toDateInputValue(shiftMonth(new Date(2026, 0, 31), 1))).toBe("2026-02-28");
  });

  it("builds whole weeks for the month grid", () => {
    const days = getMonthGridDays(new Date(2026, 10, 15));
    expect(days).toHaveLength(35);
    expect(toDateInputValue(days[0])).toBe("2026-11-01");
    expect(toDateInputValue(days[34])).toBe("2026-12-05");
  });

  it("uses the next hour today and a morning slot on other days", () => {
    expect(getDefaultSlot(day, at(14, 20))).toEqual({ startTime: "15:00", endTime: "16:00" });
    expect(getDefaultSlot(new Date(2026, 10, 9), at(14, 20))).toEqual({ startTime: "09:00", endTime: "10:00" });
  });
});

describe("event ranges", () => {
  it("keeps all-day events on their local date", () => {
    const event = { start: { date: "2026-11-07" }, end: { date: "2026-11-08" } };
    expect(isEventOnDay(event, new Date(2026, 10, 7))).toBe(true);
    expect(isEventOnDay(event, new Date(2026, 10, 8))).toBe(false);
    expect(isEventOnDay(event, new Date(2026, 10, 6))).toBe(false);
  });

  it("repairs events saved with an end before the start", () => {
    const range = getEventRange(timed("bad", at(13), at(9)));
    expect(range?.end.getTime()).toBe(at(13, 30).getTime());
  });
});

describe("layoutTimedEvents", () => {
  it("sizes blocks by duration", () => {
    const [block] = layoutTimedEvents([timed("a", at(14), at(17))], day);
    expect(block).toMatchObject({ top: 14 * 60, height: 180, lane: 0, laneCount: 1 });
  });

  it("splits overlapping events into lanes and leaves later ones full width", () => {
    const result = layoutTimedEvents(
      [timed("a", at(14), at(17)), timed("b", at(15), at(16)), timed("c", at(18), at(19))],
      day,
    );
    const byId = Object.fromEntries(result.map((item) => [item.event.id, item]));
    expect(byId.a).toMatchObject({ lane: 0, laneCount: 2 });
    expect(byId.b).toMatchObject({ lane: 1, laneCount: 2 });
    expect(byId.c).toMatchObject({ lane: 0, laneCount: 1 });
  });

  it("clips events that run past midnight", () => {
    const [block] = layoutTimedEvents([timed("late", at(23), new Date(2026, 10, 8, 1))], day);
    expect(block).toMatchObject({ top: 23 * 60, height: 60 });
  });
});

describe("resolveEventTimes", () => {
  const base = { date: "2026-11-07", startTime: "13:00", endTime: "14:00" };

  it("rejects an end before the start and missing dates", () => {
    expect(resolveEventTimes({ ...base, endTime: "09:00" })).toHaveProperty("error");
    expect(resolveEventTimes({ ...base, date: "" })).toHaveProperty("error");
  });

  it("treats an 11 PM to 12 AM event as ending at the next midnight", () => {
    const result = resolveEventTimes({ ...base, startTime: "23:00", endTime: "00:00" });
    expect(result).toEqual({ start: at(23), end: new Date(2026, 10, 8, 0) });
  });

  it("keeps an existing overnight span", () => {
    const result = resolveEventTimes({ ...base, startTime: "22:00", endTime: "01:00", endDayOffset: 1 });
    expect(result).toEqual({ start: at(22), end: new Date(2026, 10, 8, 1) });
  });
});
