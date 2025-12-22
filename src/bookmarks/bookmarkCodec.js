// src/bookmarks/bookmarkCodec.js
// URL-only "bookmark" codec.
// - Encodes an arbitrary view-state object into a compact, URL-safe string.
// - Decodes it back (with versioning + basic validation).
//
// We intentionally do NOT depend on external compression libs to keep installs simple.
// If you later want shorter URLs, we can swap in lz-string with the same interface.

const VERSION = 1;

/** Base64URL encode/decode for UTF-8 */
function base64UrlEncode(bytes) {
  let binary = "";
  const len = bytes.length;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  const b64 = btoa(binary);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecodeToBytes(b64url) {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const binary = atob(b64 + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function encodeJson(obj) {
  const json = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(json);
  return base64UrlEncode(bytes);
}

function decodeJson(encoded) {
  const bytes = base64UrlDecodeToBytes(encoded);
  const json = new TextDecoder().decode(bytes);
  return JSON.parse(json);
}

/**
 * Encodes a view state object.
 * @param {object} viewState - Any JSON-serializable object describing the view.
 * @returns {string} URL-safe string
 */
export function encodeBookmark(viewState) {
  const payload = {
    v: VERSION,
    t: Date.now(),
    s: viewState ?? {},
  };
  return encodeJson(payload);
}

/**
 * Decodes a previously-encoded bookmark string.
 * @param {string} encoded
 * @returns {{version:number, timestamp:number, state:object} | null}
 */
export function decodeBookmark(encoded) {
  if (!encoded || typeof encoded !== "string") return null;

  try {
    const payload = decodeJson(encoded);
    if (!payload || typeof payload !== "object") return null;

    const v = payload.v;
    if (typeof v !== "number") return null;

    // Forward-compat: if we bump versions, we can migrate here.
    if (v !== VERSION) {
      // For now, accept only current version.
      return null;
    }

    return {
      version: v,
      timestamp: typeof payload.t === "number" ? payload.t : 0,
      state: payload.s && typeof payload.s === "object" ? payload.s : {},
    };
  } catch {
    return null;
  }
}

/**
 * Convenience helpers for using the hash URL query param: `b=<encoded>`
 * Works with HashRouter URLs like: /#/organizations?b=....
 */

export function getBookmarkParamFromLocation() {
  // HashRouter keeps query in location.search when using react-router.
  // But if you want a raw read without router, parse window.location.hash too.
  const search = window.location.search || "";
  const params = new URLSearchParams(search);
  return params.get("b");
}

export function setBookmarkParamInUrl(encoded, { replace = true } = {}) {
  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);
  if (encoded) params.set("b", encoded);
  else params.delete("b");
  url.search = params.toString();

  if (replace) window.history.replaceState({}, "", url.toString());
  else window.history.pushState({}, "", url.toString());
}

export function clearBookmarkParamInUrl(opts) {
  setBookmarkParamInUrl("", opts);
}
