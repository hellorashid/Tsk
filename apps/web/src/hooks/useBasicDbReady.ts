import { useBasic } from "@basictech/react";

const BASIC_SUBSCRIPTION_NOT_OPEN_MESSAGE = "subscription 'own' is not open";

export function useBasicDbReady() {
  const { isReady, sync } = useBasic();

  // Basic 0.9.0-beta.1 exposes a local-first mode where the app DB can be
  // usable before sign-in. `local` is a real ready state, not just a loading phase.
  return isReady && (sync.status === "local" || sync.status === "online" || sync.status === "offline");
}

export function isBasicDbNotReadyError(error: unknown) {
  return error instanceof Error && error.message.includes(BASIC_SUBSCRIPTION_NOT_OPEN_MESSAGE);
}

export function readBasicDbSafely<T>(isDbReady: boolean, read: () => T, fallback: T): T {
  if (!isDbReady) {
    return fallback;
  }

  try {
    const result = read();

    if (result instanceof Promise) {
      return result.catch((error) => {
        if (isBasicDbNotReadyError(error)) {
          return fallback;
        }

        throw error;
      }) as T;
    }

    return result;
  } catch (error) {
    if (isBasicDbNotReadyError(error)) {
      return fallback;
    }

    throw error;
  }
}
