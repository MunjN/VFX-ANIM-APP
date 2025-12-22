// src/bookmarks/bookmarkRegistry.js
// Central place to define bookmark schemas per routeKey.
// This enables normalization (defaults + sanitization) and future migrations.

export const BOOKMARK_VERSION = 1;

/**
 * Each entry provides:
 * - defaults: the minimum shape for that page's state
 * - sanitize: (state) => sanitizedState (drops unknown fields, enforces types)
 *
 * Add new pages by adding a new routeKey entry.
 */
export const bookmarkRegistry = {
  // Example starter schema for Organizations Search.
  // We'll tighten/expand this once we wire OrganizationsSearch.jsx.
  organizations: {
    defaults: {
      q: "", // search query
      country: null,
      sizing: null,
      tags: [], // e.g., services/content/infra filters
      sort: null,
      page: 1,
    },
    sanitize: (s) => {
      const safe = {
        q: typeof s?.q === "string" ? s.q : "",
        country: typeof s?.country === "string" ? s.country : null,
        sizing: typeof s?.sizing === "string" ? s.sizing : null,
        tags: Array.isArray(s?.tags) ? s.tags.filter((t) => typeof t === "string") : [],
        sort: typeof s?.sort === "string" ? s.sort : null,
        page: Number.isFinite(Number(s?.page)) ? Math.max(1, Number(s.page)) : 1,
      };
      return safe;
    },
  },

  // Default fallback schema for pages that haven't opted into deep state yet.
  // (They can still be bookmarked via full URL in the modal.)
};

export function getSchema(routeKey) {
  return bookmarkRegistry[routeKey] || null;
}

export function normalizeState(routeKey, state) {
  const schema = getSchema(routeKey);
  if (!schema) return state || {};
  const merged = { ...schema.defaults, ...(state || {}) };
  return schema.sanitize ? schema.sanitize(merged) : merged;
}
