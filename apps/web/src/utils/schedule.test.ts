import { describe, expect, it } from "vitest";
import {
  getEventDayKey,
  getEventDuration,
  getTimeFromDateTime,
  isEventScheduledOnDay,
  minutesToDateTime,
} from "./schedule";

describe("schedule helpers", () => {
  it("calculates event duration in minutes", () => {
    expect(
      getEventDuration({
        start: { dateTime: "2026-07-07T09:15:00.000Z" },
        end: { dateTime: "2026-07-07T10:45:00.000Z" },
      }),
    ).toBe(90);
  });

  it("formats and derives time values consistently", () => {
    const date = new Date("2026-07-07T09:05:00.000Z");
    const expectedTime = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;

    expect(getTimeFromDateTime("2026-07-07T09:05:00.000Z")).toBe(expectedTime);

    const baseDate = new Date(2026, 6, 7, 0, 0, 0, 0);
    const result = new Date(minutesToDateTime(9 * 60 + 30, baseDate));

    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(6);
    expect(result.getDate()).toBe(7);
    expect(result.getHours()).toBe(9);
    expect(result.getMinutes()).toBe(30);
  });

  it("matches events to a day key for dateTime and all-day dates", () => {
    const expectedDay = new Date("2026-07-07T18:00:00.000Z");
    expectedDay.setHours(0, 0, 0, 0);

    expect(
      getEventDayKey({
        start: { dateTime: "2026-07-07T18:00:00.000Z" },
      }),
    ).toBe(expectedDay.toISOString());

    expect(
      isEventScheduledOnDay(
        {
          start: { date: "2026-07-07" },
        },
        new Date("2026-07-07T13:00:00.000Z"),
      ),
    ).toBe(true);
  });
});
