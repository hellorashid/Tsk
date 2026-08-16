import { describe, expect, it } from "vitest";
import { isBasicDbWritable } from "./useBasicDbReady";

describe("isBasicDbWritable", () => {
  it("is false until the client is ready", () => {
    expect(isBasicDbWritable(false, "local")).toBe(false);
    expect(isBasicDbWritable(false, "online")).toBe(false);
  });

  it("allows writes for local and connected sync states", () => {
    expect(isBasicDbWritable(true, "local")).toBe(true);
    expect(isBasicDbWritable(true, "online")).toBe(true);
    expect(isBasicDbWritable(true, "offline")).toBe(true);
    expect(isBasicDbWritable(true, "idle")).toBe(true);
  });

  it("allows writes while sync is still connecting or has a recoverable error", () => {
    expect(isBasicDbWritable(true, "bootstrapping")).toBe(true);
    expect(isBasicDbWritable(true, "connecting")).toBe(true);
    expect(isBasicDbWritable(true, "error")).toBe(true);
    expect(isBasicDbWritable(true, "stale")).toBe(true);
  });

  it("blocks writes only after the client has stopped", () => {
    expect(isBasicDbWritable(true, "stopped")).toBe(false);
  });
});
