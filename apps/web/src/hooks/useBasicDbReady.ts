import { basic } from "../basic";

export function isBasicDbWritable(isReady: boolean, syncStatus: string | undefined) {
  // Local replica writes should work as soon as the client is ready. After
  // OAuth, sync can sit in bootstrapping/connecting/error while the replica is
  // already usable; blocking those states silently dropped creates.
  return isReady && syncStatus !== "stopped";
}

export function useBasicDbReady() {
  const { isReady, sync } = basic.useBasic();

  return isBasicDbWritable(isReady, sync.status);
}
