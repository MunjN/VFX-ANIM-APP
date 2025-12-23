// src/api/client.js
// Centralized API client for API Gateway
// Reads auth token from sessionStorage (persists across refresh, cleared on tab close)

const API_BASE = import.meta.env.VITE_API_BASE;

function getAuthHeaders() {
  try {
    const token =
      window.sessionStorage.getItem("access_token") ||
      window.sessionStorage.getItem("id_token");
    if (token) {
      return {
        Authorization: `Bearer ${token}`,
      };
    }
  } catch {
    // ignore
  }
  return {};
}

async function request(method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = await res.json();
      msg = j?.message || msg;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
  del: (path) => request("DELETE", path),
};

export default api;
