import { basic } from "../basic";

export function useBasicDbReady() {
  const { isReady, sync } = basic.useBasic();

  return isReady && (
    sync.status === "local" ||
    sync.status === "online" ||
    sync.status === "offline" ||
    sync.status === "idle"
  );
}
