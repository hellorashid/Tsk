import { describe, expect, it, vi } from "vitest";
import { isOpenShare, normalizeShareHandle, resolveShareRecipient, shareErrorMessage, shareIncludesTask, shortDid } from "./shares";

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

describe("shareErrorMessage", () => {
  it("explains a non-schema origin repo", () => {
    expect(shareErrorMessage(new Error("origin must be an active basic-schema repo"))).toMatch(
      /older repo type/,
    );
  });

  it("includes the live repo type when known", () => {
    expect(shareErrorMessage(new Error("origin must be an active basic-schema repo"), "dynamic")).toMatch(
      /dynamic repo type/,
    );
  });
});

describe("resolveShareRecipient", () => {
  it("returns a DID unchanged", async () => {
    await expect(resolveShareRecipient("did:web:fff.basic.id")).resolves.toBe("did:web:fff.basic.id");
  });

  it("resolves a handle through the PDS", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      did: "did:web:basicid.net:u:e32d5eb80402ae5e3ca83379",
      handle: "fff.basic.id",
    })));

    await expect(resolveShareRecipient("fff", fetcher)).resolves.toBe(
      "did:web:basicid.net:u:e32d5eb80402ae5e3ca83379",
    );
    expect(fetcher).toHaveBeenCalledWith(
      "https://pds.basic.id/auth/handle/resolve?handle=fff.basic.id",
    );
  });

  it("surfaces handle-not-found errors", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ error: "Handle not found" }), { status: 404 }));
    await expect(resolveShareRecipient("alice", fetcher)).rejects.toThrow("Handle not found");
  });
});
