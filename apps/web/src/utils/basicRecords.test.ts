import { describe, expect, it } from "vitest";
import { unwrapRecord, unwrapRecords, unwrapTask, unwrapTasks } from "./basicRecords";

describe("basic record helpers", () => {
  it("unwraps a live record into a flat app object", () => {
    const task = unwrapRecord({
      id: "task-1",
      value: { name: "Write docs", completed: false },
      meta: { state: "live" as const },
    });

    expect(task).toEqual({
      id: "task-1",
      name: "Write docs",
      completed: false,
    });
  });

  it("returns null for missing, purged, or empty values", () => {
    expect(unwrapRecord(null)).toBeNull();
    expect(unwrapRecord(undefined)).toBeNull();
    expect(unwrapRecord({
      id: "gone",
      value: null,
      meta: { state: "purged" as const },
    })).toBeNull();
  });

  it("drops records without values when unwrapping a page", () => {
    const tasks = unwrapRecords([
      {
        id: "live",
        value: { name: "Keep" },
        meta: { state: "live" as const },
      },
      {
        id: "purged",
        value: null,
        meta: { state: "purged" as const },
      },
    ]);

    expect(tasks).toEqual([{ id: "live", name: "Keep" }]);
  });

  it("preserves task fields used by the app", () => {
    const tasks = unwrapTasks([
      {
        id: "parent",
        value: {
          name: "Ship",
          description: "",
          completed: true,
          labels: "folder:today",
          parentTaskId: "",
        },
      },
    ]);

    expect(tasks[0]).toMatchObject({
      id: "parent",
      name: "Ship",
      completed: true,
      labels: "folder:today",
    });
    expect(unwrapTask({
      id: "parent",
      value: {
        name: "Ship",
        description: "",
        completed: true,
        labels: "folder:today",
        parentTaskId: "",
      },
    })).toMatchObject({
      id: "parent",
      name: "Ship",
      completed: true,
      labels: "folder:today",
    });
  });
});
