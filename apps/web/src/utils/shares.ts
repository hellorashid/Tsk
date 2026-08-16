import type { OutgoingShareInfo } from "@basictech/core";

const HANDLE_RESOLVE_ORIGIN = "https://pds.basic.id";

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

export async function resolveShareRecipient(
  input: string,
  fetcher: typeof fetch = globalThis.fetch.bind(globalThis),
) {
  const trimmed = input.trim();
  if (trimmed.startsWith("did:")) {
    return trimmed;
  }

  const handle = normalizeShareHandle(trimmed);
  if (!handle) {
    throw new Error("Enter a Basic handle.");
  }

  const response = await fetcher(
    `${HANDLE_RESOLVE_ORIGIN}/auth/handle/resolve?handle=${encodeURIComponent(handle)}`,
  );
  const body = await response.json().catch(() => ({} as { did?: unknown; error?: unknown }));
  if (!response.ok || typeof body.did !== "string") {
    throw new Error(typeof body.error === "string" ? body.error : "Handle not found");
  }

  return body.did;
}
