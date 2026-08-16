import { describe, expect, it } from "vitest";
import {
  basicPdsProxyTarget,
  rewriteBasicDevUrl,
  shouldProxyBasicHost,
  stripBasicPdsProxyPrefix,
} from "./basicDevProxy";

describe("basicDevProxy", () => {
  it("rewrites published DID documents to the local origin", () => {
    expect(
      rewriteBasicDevUrl("https://tsk.lol/.well-known/did.json", "http://localhost:5173"),
    ).toBe("http://localhost:5173/.well-known/did.json");
  });

  it("proxies PDS HTTP and WebSocket URLs through Vite", () => {
    expect(
      rewriteBasicDevUrl("https://pds.basic.id/api/v1/account/repos", "http://localhost:5173"),
    ).toBe("http://localhost:5173/__basic-pds/pds.basic.id/api/v1/account/repos");

    expect(
      rewriteBasicDevUrl("wss://pds.basic.id/sync/", "http://localhost:5173"),
    ).toBe("ws://localhost:5173/__basic-pds/pds.basic.id/sync/");
  });

  it("leaves the identity origin and relative URLs alone", () => {
    expect(shouldProxyBasicHost("basic.id")).toBe(false);
    expect(rewriteBasicDevUrl("https://basic.id/authorize", "http://localhost:5173")).toBe(
      "https://basic.id/authorize",
    );
    expect(rewriteBasicDevUrl("/local", "http://localhost:5173")).toBe("/local");
  });

  it("maps proxied paths back to the PDS origin", () => {
    expect(basicPdsProxyTarget("/__basic-pds/pds.basic.id/api/v1/account/repos")).toBe(
      "https://pds.basic.id",
    );
    expect(stripBasicPdsProxyPrefix("/__basic-pds/pds.basic.id/api/v1/account/repos")).toBe(
      "/api/v1/account/repos",
    );
  });
});
