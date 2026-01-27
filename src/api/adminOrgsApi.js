// src/api/adminOrgsApi.js

const API_BASE = import.meta.env.VITE_API_BASE || ""; // e.g. "https://c78ehaqlfg.execute-api.us-east-1.amazonaws.com"
const ORGS_BASE = `${API_BASE}/api/orgs`;

function getIdToken() {
  return sessionStorage.getItem("id_token") || "";
}

async function apiFetch(path, { method = "GET", body, headers = {} } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const err = new Error((json && (json.error || json.message)) || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = json;
    throw err;
  }

  return json;
}

/**
 * SEARCH (public / not admin-guarded in your current backend)
 * Uses existing endpoint: GET /api/orgs?q=&page=&pageSize=
 */
export async function searchOrgs({ q, page = 1, pageSize = 10, extraParams = {} }) {
  const params = new URLSearchParams({
    q: q || "",
    page: String(page),
    pageSize: String(pageSize),
    ...Object.fromEntries(Object.entries(extraParams).map(([k, v]) => [k, String(v)])),
  });

  return apiFetch(`/api/orgs?${params.toString()}`, { method: "GET" });
}

/**
 * READ (public in your current backend)
 * GET /api/orgs/:orgId
 */
export async function getOrgById(orgId) {
  if (!orgId) throw new Error("orgId is required");
  return apiFetch(`/api/orgs/${encodeURIComponent(orgId)}`, { method: "GET" });
}

/**
 * ADMIN MUTATIONS (your new endpoints)
 * PATCH /api/orgs/:orgId
 */
export async function patchOrg(orgId, payload) {
  if (!orgId) throw new Error("orgId is required");

  const token = getIdToken();
  if (!token) {
    const err = new Error("Missing id_token. Please log in again.");
    err.status = 401;
    throw err;
  }

  return apiFetch(`/api/orgs/${encodeURIComponent(orgId)}`, {
    method: "PATCH",
    body: payload,
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * ADMIN CREATE (your new endpoints)
 * POST /api/orgs
 */
export async function createOrg(payload) {
  const token = getIdToken();
  if (!token) {
    const err = new Error("Missing id_token. Please log in again.");
    err.status = 401;
    throw err;
  }

  return apiFetch(`/api/orgs`, {
    method: "POST",
    body: payload,
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * ADMIN DELETE (your new endpoints)
 * DELETE /api/orgs/:orgId
 */
export async function deleteOrg(orgId) {
  const token = getIdToken();
  if (!token) {
    const err = new Error("Missing id_token. Please log in again.");
    err.status = 401;
    throw err;
  }

  return apiFetch(`/api/orgs/${encodeURIComponent(orgId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}
