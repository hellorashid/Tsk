import { createBasic } from "@basictech/react";
import { schema } from "../basic.config";

export { schema };

const DEFAULT_CLIENT_ID = "did:web:tsk.lol";
const PUBLISHED_WELL_KNOWN_ORIGIN = "https://tsk.lol";

function createBasicFetch(): typeof fetch {
  const browserFetch = globalThis.fetch.bind(globalThis);

  if (!import.meta.env.DEV || typeof window === "undefined") {
    return browserFetch;
  }

  return (input, init) => {
    const url = typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;

    if (url.startsWith(`${PUBLISHED_WELL_KNOWN_ORIGIN}/.well-known/`)) {
      return browserFetch(url.replace(PUBLISHED_WELL_KNOWN_ORIGIN, window.location.origin), init);
    }

    return browserFetch(input, init);
  };
}

export const basic = createBasic({
  schema,
  clientId: import.meta.env.VITE_BASIC_CLIENT_ID || DEFAULT_CLIENT_ID,
  debug: import.meta.env.DEV,
  allowInsecure: import.meta.env.DEV,
  fetch: createBasicFetch(),
});
