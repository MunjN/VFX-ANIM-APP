// src/bookmarks/bookmarkRegistry.js
// Central place to define bookmark schemas per routeKey.
// Enables normalization (defaults + sanitization) and future migrations.

export const BOOKMARK_VERSION = 1;

/**
 * Each entry provides:
 * - defaults: minimum shape for that page's state
 * - sanitize: (state) => sanitizedState
 *
 * Add new pages by adding a routeKey entry.
 */
export const bookmarkRegistry = {
  organizations: {
    defaults: {
      query: "",
      page: 1,
      pageSize: 25,
      selected: {},

      // Optional filters used in OrganizationsSearch
      yearMin: "",
      yearMax: "",
      ctMatch: "any",
      geoLocationIds: [],
    },
    sanitize: (s) => {
      const out = {
        query: typeof s?.query === "string" ? s.query : "",
        page: Number.isFinite(Number(s?.page)) ? Math.max(1, Number(s.page)) : 1,
        pageSize: Number.isFinite(Number(s?.pageSize)) ? Math.max(1, Number(s.pageSize)) : 25,
        selected: s?.selected && typeof s.selected === "object" ? s.selected : {},
        yearMin: typeof s?.yearMin === "string" ? s.yearMin : "",
        yearMax: typeof s?.yearMax === "string" ? s.yearMax : "",
        ctMatch: typeof s?.ctMatch === "string" ? s.ctMatch : "any",
        geoLocationIds: Array.isArray(s?.geoLocationIds)
          ? s.geoLocationIds.filter((x) => typeof x === "string" || typeof x === "number")
          : [],
      };
      return out;
    },
  },

  infrastructure: {
    defaults: {
      query: "",
      page: 1,
      pageSize: 25,
      selected: {},
    },
    sanitize: (s) => ({
      query: typeof s?.query === "string" ? s.query : "",
      page: Number.isFinite(Number(s?.page)) ? Math.max(1, Number(s.page)) : 1,
      pageSize: Number.isFinite(Number(s?.pageSize)) ? Math.max(1, Number(s.pageSize)) : 25,
      selected: s?.selected && typeof s.selected === "object" ? s.selected : {},
    }),
  },

  production_locations: {
    defaults: {
      query: "",
      page: 1,
      pageSize: 25,
      selected: {},
    },
    sanitize: (s) => ({
      query: typeof s?.query === "string" ? s.query : "",
      page: Number.isFinite(Number(s?.page)) ? Math.max(1, Number(s.page)) : 1,
      pageSize: Number.isFinite(Number(s?.pageSize)) ? Math.max(1, Number(s.pageSize)) : 25,
      selected: s?.selected && typeof s.selected === "object" ? s.selected : {},
    }),
  },
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
