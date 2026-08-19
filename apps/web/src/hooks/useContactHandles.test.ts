import { describe, expect, it } from "vitest";
import { mergeContactHandles } from "./useContactHandles";

describe("mergeContactHandles", () => {
  it("keeps the previous object when nothing changed", () => {
    const prev = { "did:plc:alice": "alice" };
    expect(
      mergeContactHandles(prev, [["did:plc:alice", "alice"]]),
    ).toBe(prev);
  });

  it("replaces the object when a handle is added", () => {
    const prev = { "did:plc:alice": "alice" };
    const next = mergeContactHandles(prev, [
      ["did:plc:alice", "alice"],
      ["did:plc:bob", "bob"],
    ]);
    expect(next).toEqual({
      "did:plc:alice": "alice",
      "did:plc:bob": "bob",
    });
    expect(next).not.toBe(prev);
  });

  it("replaces the object when a handle changes", () => {
    const prev = { "did:plc:alice": "alice" };
    expect(
      mergeContactHandles(prev, [["did:plc:alice", "alice.basic.id"]]),
    ).toEqual({
      "did:plc:alice": "alice.basic.id",
    });
  });

  it("ignores null handles", () => {
    const prev = { "did:plc:alice": "alice" };
    expect(mergeContactHandles(prev, [["did:plc:bob", null]])).toBe(prev);
  });
});
