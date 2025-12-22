// src/bookmarks/bookmarkStore.js
// Local bookmark persistence (URL-only bookmarks).
// Stores an array of { id, name, url, createdAt, updatedAt } in localStorage.

const KEY = "me_dmz_bookmarks_v1";

function safeJsonParse(s, fallback) {
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

export function listBookmarks() {
  const raw = window.localStorage.getItem(KEY);
  const arr = raw ? safeJsonParse(raw, []) : [];
  return Array.isArray(arr) ? arr : [];
}

export function saveBookmarks(bookmarks) {
  window.localStorage.setItem(KEY, JSON.stringify(bookmarks));
}

export function addBookmark({ name, url }) {
  const now = new Date().toISOString();
  const bm = {
    id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name: name?.trim() || "Untitled",
    url,
    createdAt: now,
    updatedAt: now,
  };
  const all = listBookmarks();
  const next = [bm, ...all];
  saveBookmarks(next);
  return bm;
}

export function updateBookmark(id, patch) {
  const now = new Date().toISOString();
  const all = listBookmarks();
  const next = all.map((b) =>
    b.id === id
      ? {
          ...b,
          ...patch,
          name: patch?.name != null ? String(patch.name) : b.name,
          updatedAt: now,
        }
      : b
  );
  saveBookmarks(next);
  return next.find((b) => b.id === id) || null;
}

export function deleteBookmark(id) {
  const all = listBookmarks();
  const next = all.filter((b) => b.id !== id);
  saveBookmarks(next);
  return next;
}

export function clearAllBookmarks() {
  window.localStorage.removeItem(KEY);
}
