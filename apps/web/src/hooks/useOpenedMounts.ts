import { useEffect, useRef, useState } from "react";
import { basic } from "../basic";

export function useOpenedMounts() {
  const mounts = basic.useMounts();
  const { isReady, isSignedIn } = basic.useAuth();
  const [openedIds, setOpenedIds] = useState<string[]>([]);
  const openingRef = useRef(new Set<string>());
  const mountKey = mounts.mounts
    .map((mount) => `${mount.id}:${mount.state}:${mount.originState}`)
    .join("|");

  useEffect(() => {
    if (!isReady || !isSignedIn) {
      openingRef.current.clear();
      setOpenedIds([]);
      return;
    }

    const eligible = mounts.mounts.filter(
      (mount) => mount.state === "active" && mount.originState !== "ended",
    );

    for (const mount of eligible) {
      if (openingRef.current.has(mount.id)) {
        continue;
      }

      openingRef.current.add(mount.id);
      void mounts.open(mount.id).then(
        () => {
          setOpenedIds((current) => (
            current.includes(mount.id) ? current : [...current, mount.id]
          ));
        },
        (error: unknown) => {
          openingRef.current.delete(mount.id);
          console.error("Failed to open shared mount", error);
        },
      );
    }
  }, [isReady, isSignedIn, mountKey, mounts]);

  const openedMounts = mounts.mounts.filter((mount) => openedIds.includes(mount.id));
  const pendingOpen = isSignedIn && mounts.mounts.some((mount) => (
    mount.state === "active"
    && mount.originState !== "ended"
    && !openedIds.includes(mount.id)
  ));

  return {
    isReady,
    isSignedIn,
    isLoading: mounts.isLoading || pendingOpen,
    error: mounts.error,
    mounts: openedMounts,
    manageUrl: mounts.manageUrl(),
  };
}
