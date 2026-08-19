import { useEffect, useEffectEvent, useState } from "react";

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
  const didKey = [...new Set(dids.filter(Boolean))].toSorted().join("|");
  const hasLookup = Boolean(getContactHandle);
  const lookupContactHandle = useEffectEvent(async (did: string) => {
    return getContactHandle ? getContactHandle(did) : null;
  });

  useEffect(() => {
    const unique = didKey ? didKey.split("|") : [];
    if (unique.length === 0 || !hasLookup) {
      return undefined;
    }

    let cancelled = false;

    void Promise.all(
      unique.map(async (did) => [did, await lookupContactHandle(did)] as const),
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
