export const PUBLISHED_WELL_KNOWN_ORIGIN = "https://tsk.lol";
export const BASIC_PDS_PROXY_PREFIX = "/__basic-pds";

export function shouldProxyBasicHost(hostname: string) {
  if (hostname === "basic.id" || hostname === "www.basic.id") {
    return false;
  }

  return hostname === "pds.basic.id" || hostname.endsWith(".basic.id");
}

export function rewriteBasicDevUrl(url: string, origin: string) {
  if (url.startsWith(`${PUBLISHED_WELL_KNOWN_ORIGIN}/.well-known/`)) {
    return `${origin}${url.slice(PUBLISHED_WELL_KNOWN_ORIGIN.length)}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  if (!shouldProxyBasicHost(parsed.hostname)) {
    return url;
  }

  const proxied = new URL(origin);
  proxied.pathname = `${BASIC_PDS_PROXY_PREFIX}/${parsed.host}${parsed.pathname}`;
  proxied.search = parsed.search;
  proxied.hash = parsed.hash;
  if (parsed.protocol === "ws:" || parsed.protocol === "wss:") {
    proxied.protocol = origin.startsWith("https:") ? "wss:" : "ws:";
  }

  return proxied.toString();
}

export function basicPdsProxyTarget(requestUrl: string) {
  const path = requestUrl.startsWith("http") ? new URL(requestUrl).pathname : requestUrl;
  const match = path.match(/^\/__basic-pds\/([^/?#]+)/);
  return match ? `https://${match[1]}` : "https://pds.basic.id";
}

export function stripBasicPdsProxyPrefix(path: string) {
  return path.replace(/^\/__basic-pds\/[^/]+/, "") || "/";
}
