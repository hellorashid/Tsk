import { describe, expect, it } from "vitest";
import { isOpenShare, normalizeShareHandle, shareIncludesTask, shortDid } from "./shares";

describe("normalizeShareHandle", () => {
  it("trims, lowercases, and adds .basic.id when needed", () => {
    expect(normalizeShareHandle("  @FFF  ")).toBe("fff.basic.id");
    expect(normalizeShareHandle("alice.basic.id")).toBe("alice.basic.id");
    expect(normalizeShareHandle("")).toBe("");
  });
});

describe("shareIncludesTask", () => {
  it("matches a task-scoped share", () => {
    expect(shareIncludesTask({
      scope: [{ table: "tasks", recordIds: ["task-1"] }],
    }, "task-1")).toBe(true);
    expect(shareIncludesTask({
      scope: [{ table: "tasks", recordIds: ["task-2"] }],
    }, "task-1")).toBe(false);
  });

  it("treats a whole-table tasks share as including the task", () => {
    expect(shareIncludesTask({ scope: [{ table: "tasks" }] }, "task-1")).toBe(true);
  });
});

describe("isOpenShare", () => {
  it("keeps pending and active shares", () => {
    expect(isOpenShare({ state: "pending" })).toBe(true);
    expect(isOpenShare({ state: "active" })).toBe(true);
    expect(isOpenShare({ state: "ended" })).toBe(false);
  });
});

describe("shortDid", () => {
  it("shortens long DIDs", () => {
    expect(shortDid("did:web:fff.basic.id")).toBe("did:web:fff.basic.id");
    expect(shortDid("did:plc:abcdefghijklmnopqrstuvwxyz")).toBe("did:plc:ab…uvwxyz");
  });
});
