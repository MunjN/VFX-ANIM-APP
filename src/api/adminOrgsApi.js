// src/api/adminOrgsApi.js

const RAW_BASE = import.meta.env.VITE_API_BASE || "https://c78ehaqlfg.execute-api.us-east-1.amazonaws.com";
const API_BASE = RAW_BASE.replace(/\/+$/, ""); // strip trailing /

function getIdToken() {
  return sessionStorage.getItem("id_token") || "";
}

function bestErrorMessage(json, status) {
  if (!json) return `Request failed (${status})`;
  if (Array.isArray(json.errors) && json.errors.length) return json.errors[0];
  return json.error || json.message || `Request failed (${status})`;
}

async function apiFetch(path, { method = "GET", body, headers = {} } = {}) {
  const url = `${API_BASE}${path}`;

  const finalHeaders = { ...headers };
  const hasBody = body !== undefined;

  // only set content-type when we actually send JSON
  if (hasBody) finalHeaders["Content-Type"] = "application/json; charset=utf-8";

  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    body: hasBody ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const err = new Error(bestErrorMessage(json, res.status));
    err.status = res.status;
    err.data = json;
    throw err;
  }

  return json;
}

/**
 * SEARCH (public)
 * GET /api/orgs?q=&page=&pageSize=
 */
async function search({ q, page = 1, pageSize = 10, extraParams = {} }) {
  const params = new URLSearchParams({
    q: q || "",
    page: String(page),
    pageSize: String(pageSize),
    ...Object.fromEntries(
      Object.entries(extraParams).map(([k, v]) => [k, String(v)])
    ),
  });

  return apiFetch(`/api/orgs?${params.toString()}`, { method: "GET" });
}

/**
 * READ (public)
 * GET /api/orgs/:orgId
 */
async function getById(orgId) {
  if (!orgId) throw new Error("orgId is required");
  return apiFetch(`/api/orgs/${encodeURIComponent(orgId)}`, { method: "GET" });
}

function requireToken() {
  const token = getIdToken();
  if (!token) {
    const err = new Error("Missing id_token. Please log in again.");
    err.status = 401;
    throw err;
  }
  return token;
}

/**
 * ADMIN CREATE
 * POST /api/orgs
 */
async function create(payload) {
  const token = requireToken();
  return apiFetch(`/api/orgs`, {
    method: "POST",
    body: payload,
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * ADMIN PATCH
 * PATCH /api/orgs/:orgId
 */
async function patch(orgId, payload) {
  if (!orgId) throw new Error("orgId is required");
  const token = requireToken();
  return apiFetch(`/api/orgs/${encodeURIComponent(orgId)}`, {
    method: "PATCH",
    body: payload,
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * ADMIN DELETE
 * DELETE /api/orgs/:orgId
 */
async function remove(orgId) {
  if (!orgId) throw new Error("orgId is required");
  const token = requireToken();
  return apiFetch(`/api/orgs/${encodeURIComponent(orgId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export default { search, getById, create, patch, remove };

export { search as searchOrgs, getById as getOrgById, create as createOrg, patch as patchOrg, remove as deleteOrg };
