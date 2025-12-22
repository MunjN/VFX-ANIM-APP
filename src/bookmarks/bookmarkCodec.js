// src/bookmarks/bookmarkCodec.js
// Option A bookmarks: one URL param `b=` that contains { v, routeKey, state, ts }.
// - URL-safe
// - Versioned
// - Normalized via bookmarkRegistry (defaults + sanitize)
// - HashRouter-friendly (works inside location.hash)

import { BOOKMARK_VERSION, normalizeState } from "./bookmarkRegistry";

function toUrlSafeBase64(str) {
  // Base64 -> URL safe (no +, /, =)
  const b64 = btoa(unescape(encodeURIComponent(str)));
  return b64.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function fromUrlSafeBase64(b64url) {
  // Restore padding
  let b64 = b64url.replaceAll("-", "+").replaceAll("_", "/");
  const pad = b64.length % 4;
  if (pad === 2) b64 += "==";
  else if (pad === 3) b64 += "=";
  else if (pad !== 0) {
    // invalid length
    throw new Error("Invalid base64url length");
  }
  const str = decodeURIComponent(escape(atob(b64)));
  return str;
}

export function encodeBookmark({ routeKey, state }) {
  const payload = {
    v: BOOKMARK_VERSION,
    routeKey,
    state: state || {},
    ts: Date.now(),
  };
  const json = JSON.stringify(payload);
  return toUrlSafeBase64(json);
}

export function decodeBookmark(encoded) {
  if (!encoded || typeof encoded !== "string") return null;

  try {
    const json = fromUrlSafeBase64(encoded);
    const payload = JSON.parse(json);

    if (!payload || typeof payload !== "object") return null;
    if (payload.v !== BOOKMARK_VERSION) {
      // Future: migrate older versions here if needed.
      return null;
    }

    const routeKey = typeof payload.routeKey === "string" ? payload.routeKey : null;
    const state = normalizeState(routeKey, payload.state);

    return {
      ...payload,
      routeKey,
      state,
    };
  } catch {
    return null;
  }
}

function getHashQueryString() {
  // With HashRouter, query params live after the route in the hash:
  // location.hash = "#/path?b=...."
  const hash = window.location.hash || "";
  const qIndex = hash.indexOf("?");
  return qIndex >= 0 ? hash.slice(qIndex) : "";
}

function setHashQueryString(newQueryString) {
  const hash = window.location.hash || "#/";
  const qIndex = hash.indexOf("?");
  const base = qIndex >= 0 ? hash.slice(0, qIndex) : hash;
  window.location.hash = `${base}${newQueryString || ""}`;
}

export function readBookmarkFromLocation() {
  const qs = getHashQueryString();
  const params = new URLSearchParams(qs);
  const b = params.get("b");
  return b || null;
}

export function writeBookmarkToLocation(encoded) {
  const qs = getHashQueryString();
  const params = new URLSearchParams(qs);
  params.set("b", encoded);
  const next = `?${params.toString()}`;
  setHashQueryString(next);
}

export function clearBookmarkFromLocation() {
  const qs = getHashQueryString();
  const params = new URLSearchParams(qs);
  params.delete("b");
  const s = params.toString();
  setHashQueryString(s ? `?${s}` : "");
}
