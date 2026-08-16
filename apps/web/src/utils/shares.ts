import type { OutgoingShareInfo } from "@basictech/core";

export function normalizeShareHandle(input: string) {
  const trimmed = input.trim().toLowerCase().replace(/^@/, "");
  if (!trimmed) {
    return "";
  }

  return trimmed.includes(".") ? trimmed : `${trimmed}.basic.id`;
}

export function shareIncludesTask(share: Pick<OutgoingShareInfo, "scope">, taskId: string) {
  return share.scope.some((clause) => {
    if (clause.table !== "tasks") {
      return false;
    }

    return !clause.recordIds || clause.recordIds.includes(taskId);
  });
}

export function isOpenShare(share: Pick<OutgoingShareInfo, "state">) {
  return share.state === "pending" || share.state === "active";
}

export function shortDid(did: string) {
  if (did.length <= 20) {
    return did;
  }

  return `${did.slice(0, 10)}…${did.slice(-6)}`;
}
