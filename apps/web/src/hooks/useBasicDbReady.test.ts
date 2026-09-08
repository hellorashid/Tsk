import { describe, expect, it } from "vitest";
import { isBasicDbWritable } from "./useBasicDbReady";

describe("isBasicDbWritable", () => {
  it("is false until the client is ready", () => {
    expect(isBasicDbWritable(false, "local", true)).toBe(false);
    expect(isBasicDbWritable(false, "online", true)).toBe(false);
  });

  it("allows writes for local and connected sync states when canWrite is true", () => {
    expect(isBasicDbWritable(true, "local", true)).toBe(true);
    expect(isBasicDbWritable(true, "online", true)).toBe(true);
    expect(isBasicDbWritable(true, "offline", true)).toBe(true);
    expect(isBasicDbWritable(true, "idle", true)).toBe(true);
  });

  it("allows writes while sync is still connecting or has a recoverable error when canWrite is true", () => {
    expect(isBasicDbWritable(true, "bootstrapping", true)).toBe(true);
    expect(isBasicDbWritable(true, "connecting", true)).toBe(true);
    expect(isBasicDbWritable(true, "error", true)).toBe(true);
    expect(isBasicDbWritable(true, "stale", true)).toBe(true);
  });

  it("blocks writes only after the client has stopped", () => {
    expect(isBasicDbWritable(true, "stopped", true)).toBe(false);
  });

  it("blocks writes when canWrite is false (e.g., expired auth) even if client is ready", () => {
    expect(isBasicDbWritable(true, "online", false)).toBe(false);
    expect(isBasicDbWritable(true, "local", false)).toBe(false);
    expect(isBasicDbWritable(true, "offline", false)).toBe(false);
  });

  it("blocks writes when both stopped and canWrite is false", () => {
    expect(isBasicDbWritable(true, "stopped", false)).toBe(false);
  });
});
