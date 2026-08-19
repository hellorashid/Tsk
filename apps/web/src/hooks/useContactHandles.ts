import { useEffect, useRef, useState } from "react";

export function mergeContactHandles(
  current: Record<string, string>,
  entries: ReadonlyArray<readonly [string, string | null]>,
) {
  let changed = false;
  const next = { ...current };
  for (const [did, handle] of entries) {
    if (handle && next[did] !== handle) {
      next[did] = handle;
      changed = true;
    }
  }

  return changed ? next : current;
}

export function useContactHandles(
  dids: string[],
  getContactHandle?: ((did: string) => Promise<string | null>) | null,
) {
  const [handles, setHandles] = useState<Record<string, string>>({});
  const getContactHandleRef = useRef(getContactHandle);
  getContactHandleRef.current = getContactHandle;
  const didKey = [...new Set(dids.filter(Boolean))].toSorted().join("|");
  const hasLookup = Boolean(getContactHandle);

  useEffect(() => {
    const unique = didKey ? didKey.split("|") : [];
    const lookup = getContactHandleRef.current;
    if (unique.length === 0 || !lookup) {
      return undefined;
    }

    let cancelled = false;

    void Promise.all(
      unique.map(async (did) => [did, await lookup(did)] as const),
    ).then((entries) => {
      if (cancelled) {
        return;
      }

      setHandles((current) => mergeContactHandles(current, entries));
    });

    return () => {
      cancelled = true;
    };
  }, [didKey, hasLookup]);

  return handles;
}
