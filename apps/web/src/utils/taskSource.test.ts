import { describe, expect, it } from "vitest";
import { canEditTaskSource, isSharedTaskSource } from "./taskSource";

describe("isSharedTaskSource", () => {
  it("is true only for a mount source", () => {
    expect(isSharedTaskSource(null)).toBe(false);
    expect(isSharedTaskSource({ mountId: "mnt_1", role: "viewer" })).toBe(true);
  });
});

describe("canEditTaskSource", () => {
  it("allows local tasks and shared editors", () => {
    expect(canEditTaskSource(null)).toBe(true);
    expect(canEditTaskSource({ mountId: "mnt_1", role: "editor" })).toBe(true);
    expect(canEditTaskSource({ mountId: "mnt_1", role: "viewer" })).toBe(false);
  });
});
