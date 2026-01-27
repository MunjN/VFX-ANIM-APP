// src/api/adminOrgsApi.js
const base = import.meta.env.VITE_API_BASE || "https://c78ehaqlfg.execute-api.us-east-1.amazonaws.com";

function getIdToken() {
  try {
    return window.sessionStorage.getItem("id_token") || "";
  } catch {
    return "";
  }
}

async function adminReq(method, path, body) {
  const token = getIdToken();
  if (!token) throw new Error("Missing id_token (please sign in again).");

  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, 
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(json?.error || json?.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = json;
    throw err;
  }
  return json;
}

export const adminOrgsApi = {
  suggest: (q) => adminReq("GET", `/api/orgs/suggest?q=${encodeURIComponent(q)}`),
  create: (payload) => adminReq("POST", "/api/orgs", payload),
  patch: (orgId, payload) => adminReq("PATCH", `/api/orgs/${encodeURIComponent(orgId)}`, payload),
  remove: (orgId) => adminReq("DELETE", `/api/orgs/${encodeURIComponent(orgId)}`),
};

export default adminOrgsApi;
