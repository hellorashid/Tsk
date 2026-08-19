import { useEffect, useState } from "react";

export function useContactHandles(
  dids: string[],
  getContactHandle: (did: string) => Promise<string | null>,
) {
  const [handles, setHandles] = useState<Record<string, string>>({});
  const didKey = [...new Set(dids.filter(Boolean))].toSorted().join("|");

  useEffect(() => {
    const unique = didKey ? didKey.split("|") : [];
    if (unique.length === 0) {
      return undefined;
    }

    let cancelled = false;

    void Promise.all(
      unique.map(async (did) => [did, await getContactHandle(did)] as const),
    ).then((entries) => {
      if (cancelled) {
        return;
      }

      setHandles((current) => {
        const next = { ...current };
        for (const [did, handle] of entries) {
          if (handle) {
            next[did] = handle;
          }
        }
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [didKey, getContactHandle]);

  return handles;
}
