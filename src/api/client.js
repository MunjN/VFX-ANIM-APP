// src/api/client.js
// Centralized API client for API Gateway + Lambda.
// In later steps we will attach Cognito tokens automatically.

import Cookies from "js-cookie";

const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

function buildUrl(path) {
  if (!API_BASE) {
    // Allow relative calls in local dev if you keep a proxy,
    // but for production (GitHub Pages) you should set VITE_API_BASE.
    return path.startsWith("/") ? path : `/${path}`;
  }
  if (!path.startsWith("/")) path = `/${path}`;
  return `${API_BASE}${path}`;
}

async function request(path, { method = "GET", headers = {}, body, auth = true } = {}) {
  const url = buildUrl(path);

  const finalHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  // Token wiring (placeholder): we'll standardize on a cookie name in Auth module.
  // If present, send as Bearer token.
  if (auth) {
    const idToken = Cookies.get("id_token") || Cookies.get("access_token");
    if (idToken) finalHeaders.Authorization = `Bearer ${idToken}`;
  }

  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    body: body == null ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });

  // Helpful error surface
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!res.ok) {
    let details = "";
    try {
      details = isJson ? JSON.stringify(await res.json()) : await res.text();
    } catch {
      // ignore parse errors
    }
    const err = new Error(`API ${method} ${url} failed: ${res.status} ${res.statusText}${details ? ` - ${details}` : ""}`);
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) return null;
  return isJson ? res.json() : res.text();
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => request(path, { ...opts, method: "POST", body }),
  put: (path, body, opts) => request(path, { ...opts, method: "PUT", body }),
  del: (path, opts) => request(path, { ...opts, method: "DELETE" }),
};

export function getApiBase() {
  return API_BASE;
}
