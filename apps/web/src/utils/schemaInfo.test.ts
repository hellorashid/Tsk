import { describe, expect, it } from "vitest";
import { canShareFromRepoType, defaultRepoType, getSchemaInfoDisplay } from "./schemaInfo";

describe("defaultRepoType", () => {
  it("prefers the catalog default repo id", () => {
    expect(defaultRepoType([
      { id: "old", schema_type: "freeform", access: { is_default: true } },
      { id: "new", schema_type: "basic-schema" },
    ], "new")).toBe("basic-schema");
  });

  it("falls back to the marked default repo", () => {
    expect(defaultRepoType([
      { id: "old", schema_type: "dynamic", access: { is_default: true } },
    ], null)).toBe("dynamic");
  });
});

describe("canShareFromRepoType", () => {
  it("only allows basic-schema origins", () => {
    expect(canShareFromRepoType("basic-schema")).toBe(true);
    expect(canShareFromRepoType("dynamic")).toBe(false);
    expect(canShareFromRepoType("freeform")).toBe(false);
    expect(canShareFromRepoType(null)).toBe(false);
  });
});

describe("getSchemaInfoDisplay", () => {
  it("summarizes local and server versions", () => {
    const info = getSchemaInfoDisplay({
      projectId: "701b11bc-59a8-45b5-8148-7184d7733e5b",
      clientId: "did:web:tsk.lol",
      localVersion: 6,
      mode: "dynamic",
      serverVersion: 1,
      defaultRepoSchemaType: "dynamic",
    });

    expect(info.summary).toBe("dynamic · app v6 · server v1");
    expect(info.canShare).toBe(false);
    expect(info.shareHint).toMatch(/older type/);
  });

  it("marks a basic-schema repo as shareable", () => {
    const info = getSchemaInfoDisplay({
      projectId: "701b11bc-59a8-45b5-8148-7184d7733e5b",
      clientId: "did:web:tsk.lol",
      localVersion: 6,
      mode: "basic-schema",
      serverVersion: 6,
    });

    expect(info.canShare).toBe(true);
    expect(info.shareHint).toBeUndefined();
  });
});
