import { isIP } from "node:net";

export const DEFAULT_EMAIL_ASSET_ORIGIN = "https://www.americantranslationservice.com";

/** Email clients must be able to fetch assets without access to the dev server. */
export function emailAssetOrigin() {
  const value = process.env.EMAIL_ASSET_ORIGIN?.trim() || DEFAULT_EMAIL_ASSET_ORIGIN;
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash ||
      url.pathname !== "/" || !host.includes(".") || host.endsWith(".localhost") ||
      host.endsWith(".local") || isIP(host) || host.includes(":")) {
    throw new Error("EMAIL_ASSET_ORIGIN must be a public HTTPS origin");
  }
  return url.origin;
}
