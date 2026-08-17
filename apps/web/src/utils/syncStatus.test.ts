import { describe, expect, it } from "vitest";
import { getSyncStatusDisplay } from "./syncStatus";

describe("getSyncStatusDisplay", () => {
  it("shows local-only when signed out", () => {
    expect(getSyncStatusDisplay({
      isSignedIn: false,
      syncStatus: "local",
      pendingCount: 0,
    })).toMatchObject({
      label: "Local only",
      tone: "neutral",
    });
  });

  it("asks for sign-in when reauth is required", () => {
    expect(getSyncStatusDisplay({
      isSignedIn: true,
      authStatus: "reauth_required",
      syncStatus: "error",
      pendingCount: 0,
    }).label).toBe("Needs sign-in");
  });

  it("shows online with a pending count", () => {
    expect(getSyncStatusDisplay({
      isSignedIn: true,
      syncStatus: "online",
      pendingCount: 2,
    })).toMatchObject({
      label: "Online",
      detail: "2 changes syncing.",
      tone: "pending",
    });
  });

  it("shows offline waiting changes", () => {
    expect(getSyncStatusDisplay({
      isSignedIn: true,
      syncStatus: "offline",
      pendingCount: 1,
    })).toMatchObject({
      label: "Offline",
      detail: "1 change is waiting to sync.",
      tone: "warn",
    });
  });

  it("treats connecting states as pending", () => {
    expect(getSyncStatusDisplay({
      isSignedIn: true,
      syncStatus: "bootstrapping",
      pendingCount: 0,
    }).label).toBe("Connecting");
  });
});
