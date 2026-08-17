import { describe, expect, it } from "vitest";
import { PROJECT_ID, schema } from "../basic.config";
import { BASIC_CLIENT_ID } from "./basic";

describe("Basic project identity", () => {
  it("uses the project DID as the client id", () => {
    expect(schema.project_id).toBe(PROJECT_ID);
    expect(BASIC_CLIENT_ID).toBe(PROJECT_ID);
    expect(PROJECT_ID).toBe("did:web:api.basic.tech:projects:701b11bc59a845b581487184d7733e5b");
  });
});
