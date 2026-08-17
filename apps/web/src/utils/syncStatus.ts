export type SyncStatusTone = "good" | "warn" | "pending" | "neutral" | "error";

export interface SyncStatusDisplay {
  label: string;
  detail: string;
  tone: SyncStatusTone;
}

function pendingDetail(pendingCount: number, waiting: boolean) {
  if (pendingCount <= 0) {
    return null;
  }

  const noun = pendingCount === 1 ? "change" : "changes";
  if (waiting) {
    return `${pendingCount} ${pendingCount === 1 ? "change is" : "changes are"} waiting to sync.`;
  }

  return `${pendingCount} ${noun} syncing.`;
}

export function getSyncStatusDisplay({
  isSignedIn,
  authStatus,
  syncStatus,
  pendingCount,
}: {
  isSignedIn: boolean;
  authStatus?: string;
  syncStatus: string | undefined;
  pendingCount: number;
}): SyncStatusDisplay {
  if (!isSignedIn) {
    return {
      label: "Local only",
      detail: "Tasks stay in this browser.",
      tone: "neutral",
    };
  }

  if (authStatus === "reauth_required") {
    return {
      label: "Needs sign-in",
      detail: "Sign in again to resume sync.",
      tone: "warn",
    };
  }

  if (syncStatus === "error") {
    return {
      label: "Sync error",
      detail: pendingDetail(pendingCount, true) ?? "Could not reach Basic.",
      tone: "error",
    };
  }

  if (syncStatus === "offline" || syncStatus === "ended") {
    return {
      label: "Offline",
      detail: pendingDetail(pendingCount, true) ?? "Changes stay on this device until you are back online.",
      tone: "warn",
    };
  }

  if (syncStatus === "online") {
    return {
      label: "Online",
      detail: pendingDetail(pendingCount, false) ?? "Synced with Basic.",
      tone: pendingCount > 0 ? "pending" : "good",
    };
  }

  if (
    syncStatus === "connecting"
    || syncStatus === "idle"
    || syncStatus === "bootstrapping"
    || !syncStatus
  ) {
    return {
      label: "Connecting",
      detail: "Checking sync…",
      tone: "pending",
    };
  }

  if (syncStatus === "stopped") {
    return {
      label: "Stopped",
      detail: "Sync is not running.",
      tone: "warn",
    };
  }

  return {
    label: "On this device",
    detail: "Using the local copy of your tasks.",
    tone: "neutral",
  };
}
