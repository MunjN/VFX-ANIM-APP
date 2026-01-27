// src/api/adminInfraApi.js
// Mirrors src/api/adminOrgsApi style, but for Infra admin flows.
//
// Uses:
// - Public/search:   GET    /api/infra?q=...
// - Admin filters:   GET    /api/admin/infra/filters
// - Admin load:      GET    /api/admin/infra/:infraId
// - Admin mutate:    POST   /api/infra
//                   PATCH  /api/infra/:infraId
//                   DELETE /api/infra/:infraId
//
// Auth: sends Cognito id_token as Bearer.

const base =
  import.meta.env.VITE_API_BASE ||
  "https://c78ehaqlfg.execute-api.us-east-1.amazonaws.com";

function getIdToken() {
  return window.sessionStorage.getItem("id_token") || "";
}

async function http(method, path, { query, body, auth = true } = {}) {
  const url = new URL(`${base}${path}`);

  if (query && typeof query === "object") {
    for (const [k, v] of Object.entries(query)) {
      if (v == null || v === "") continue;
      url.searchParams.set(k, String(v));
    }
  }

  const headers = { "content-type": "application/json" };
  if (auth) {
    const token = getIdToken();
    if (token) headers.authorization = `Bearer ${token}`;
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body == null ? undefined : JSON.stringify(body),
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text || null;
  }

  if (!res.ok) {
    const err = new Error(
      (data && (data.error || data.message)) || `Request failed (${res.status})`
    );
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

/* =========================
   Public/Search
   ========================= */

// GET /api/infra?q=...&page=1&pageSize=25
export async function searchInfra({ q, page = 1, pageSize = 25, ...rest } = {}) {
  return http("GET", "/api/infra", {
    query: { q: q || "", page, pageSize, ...rest },
    auth: false, // this endpoint typically doesn't require admin auth
  });
}

/* =========================
   Admin: Filters + Load
   ========================= */

// GET /api/admin/infra/filters
export async function getInfraFilters() {
  return http("GET", "/api/admin/infra/filters", { auth: true });
}

// GET /api/admin/infra/:infraId
export async function getInfraById(infraId) {
  if (!infraId) throw new Error("infraId is required");
  return http("GET", `/api/admin/infra/${encodeURIComponent(infraId)}`, {
    auth: true,
  });
}

/* =========================
   Admin: Mutations (Mongo)
   ========================= */

// POST /api/infra
// payload shape expected by your backend:
// { infra: { ...fields }, forceCreate?: boolean }
export async function createInfra(payload) {
  return http("POST", "/api/infra", { body: payload || {}, auth: true });
}

// PATCH /api/infra/:infraId
// payload shape expected: { infra: { ...patchFields } }
export async function patchInfra(infraId, payload) {
  if (!infraId) throw new Error("infraId is required");
  return http("PATCH", `/api/infra/${encodeURIComponent(infraId)}`, {
    body: payload || {},
    auth: true,
  });
}

// DELETE /api/infra/:infraId
export async function deleteInfra(infraId) {
  if (!infraId) throw new Error("infraId is required");
  return http("DELETE", `/api/infra/${encodeURIComponent(infraId)}`, {
    auth: true,
  });
}
