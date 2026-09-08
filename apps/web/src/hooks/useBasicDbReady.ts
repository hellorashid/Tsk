import { basic } from "../basic";

export function isBasicDbWritable(
  isReady: boolean,
  syncStatus: string | undefined,
  canWrite: boolean
) {
  // Beta.3 migration: check canWrite to respect auth expiry and other
  // read-only states. Local replica writes should work as soon as the client
  // is ready, unless canWrite is false (e.g., expired auth).
  // After OAuth, sync can sit in bootstrapping/connecting/error while the
  // replica is already usable; blocking those states silently dropped creates.
  return isReady && syncStatus !== "stopped" && canWrite;
}

export function useBasicDbReady() {
  const { isReady, sync, canWrite } = basic.useBasic();

  return isBasicDbWritable(isReady, sync.status, canWrite);
}
