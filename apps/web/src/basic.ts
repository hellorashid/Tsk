import { createBasic } from "@basictech/react";
import { PROJECT_ID, schema } from "../basic.config";
import { rewriteBasicDevUrl } from "./basicDevProxy";

export { PROJECT_ID, schema };

export const BASIC_CLIENT_ID = PROJECT_ID;

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
    const rewritten = rewriteBasicDevUrl(url, window.location.origin);

    if (rewritten === url) {
      return browserFetch(input, init);
    }

    if (input instanceof Request) {
      return browserFetch(new Request(rewritten, input), init);
    }

    return browserFetch(rewritten, init);
  };
}

function createBasicWebSocket() {
  if (!import.meta.env.DEV || typeof window === "undefined") {
    return undefined;
  }

  return class BasicDevWebSocket extends WebSocket {
    constructor(url: string | URL, protocols?: string | string[]) {
      super(rewriteBasicDevUrl(url.toString(), window.location.origin), protocols);
    }
  };
}

export const basic = createBasic({
  schema,
  clientId: BASIC_CLIENT_ID,
  debug: import.meta.env.DEV,
  allowInsecure: import.meta.env.DEV,
  fetch: createBasicFetch(),
  WebSocketImpl: createBasicWebSocket(),
});
