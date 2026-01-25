// src/state/visualizeFiltersStore.js
import { useSyncExternalStore } from "react";

function cloneSet(s) {
  return new Set(s ? Array.from(s) : []);
}

const DEFAULT_STATE = {
  // GLOBAL (persist across ALL views)
  salesRegions: new Set(), // -> SALES_REGION (labels)
  countries: new Set(), // -> GEONAME_COUNTRY_NAME (or COUNTRY_NAME depending on view; we normalize in UI)

  // CLOUD VIEW ONLY (cleared when leaving cloud view)
  cloudProviders: new Set(), // -> CLOUD_PROVIDER

  // ORGS VIEW ONLY (cleared when leaving orgs view)
  cities: new Set(), // -> CITY
  orgIds: new Set(), // org drilldown
  locationIds: new Set(), // optional, future

  // used by orgs locations endpoints; keep default stable
  locationScope: "all",

  // view mode (page-level)
  // orgs | tax | geodata | cloud
  viewMode: "orgs",

  // ---------------------------
  // NON-ORGS VIEW SELECTION (for modal + highlight)
  // ---------------------------
  selectedViewType: null, // "tax" | "geodata" | "cloud" | null
  selectedViewItem: null, // object | null
  selectedFeatureId: null, // string | null
};

let state = {
  ...DEFAULT_STATE,
  salesRegions: cloneSet(DEFAULT_STATE.salesRegions),
  countries: cloneSet(DEFAULT_STATE.countries),
  cloudProviders: cloneSet(DEFAULT_STATE.cloudProviders),
  cities: cloneSet(DEFAULT_STATE.cities),
  orgIds: cloneSet(DEFAULT_STATE.orgIds),
  locationIds: cloneSet(DEFAULT_STATE.locationIds),
};

const listeners = new Set();

function emit() {
  for (const l of listeners) l();
}

export function getVisualizeFilters() {
  return state;
}

/**
 * Patch setter. Supports:
 * - Arrays or Sets for set fields
 * - viewMode changes
 * - selection/modal state
 */
export function setVisualizeFilters(patch) {
  const next = { ...state };

  // GLOBAL
  if (patch.salesRegions !== undefined) {
    next.salesRegions =
      patch.salesRegions instanceof Set
        ? cloneSet(patch.salesRegions)
        : new Set(patch.salesRegions || []);
  }
  if (patch.countries !== undefined) {
    next.countries =
      patch.countries instanceof Set
        ? cloneSet(patch.countries)
        : new Set(patch.countries || []);
  }

  // CLOUD VIEW ONLY (still allowed to set; view switching can clear)
  if (patch.cloudProviders !== undefined) {
    next.cloudProviders =
      patch.cloudProviders instanceof Set
        ? cloneSet(patch.cloudProviders)
        : new Set(patch.cloudProviders || []);
  }

  // ORGS VIEW ONLY (still allowed to set; view switching can clear)
  if (patch.cities !== undefined) {
    next.cities =
      patch.cities instanceof Set ? cloneSet(patch.cities) : new Set(patch.cities || []);
  }
  if (patch.orgIds !== undefined) {
    next.orgIds =
      patch.orgIds instanceof Set ? cloneSet(patch.orgIds) : new Set(patch.orgIds || []);
  }
  if (patch.locationIds !== undefined) {
    next.locationIds =
      patch.locationIds instanceof Set
        ? cloneSet(patch.locationIds)
        : new Set(patch.locationIds || []);
  }

  if (patch.locationScope !== undefined) {
    next.locationScope =
      String(patch.locationScope || "all").toLowerCase() === "hq" ? "hq" : "all";
  }

  // viewMode (normalized)
  if (patch.viewMode !== undefined) {
    const vm = String(patch.viewMode || "orgs").toLowerCase();
    next.viewMode = vm === "tax" || vm === "geodata" || vm === "cloud" ? vm : "orgs";
  }

  // selection / modal state (used in non-org views)
  if (patch.selectedViewType !== undefined) {
    const vt = patch.selectedViewType == null ? null : String(patch.selectedViewType).toLowerCase();
    next.selectedViewType = vt === "tax" || vt === "geodata" || vt === "cloud" ? vt : null;
  }
  if (patch.selectedViewItem !== undefined) {
    next.selectedViewItem = patch.selectedViewItem ?? null;
  }
  if (patch.selectedFeatureId !== undefined) {
    next.selectedFeatureId =
      patch.selectedFeatureId == null ? null : String(patch.selectedFeatureId);
  }

  state = next;
  emit();
}

/**
 * Close modal / clear selection (non-org views)
 */
export function closeViewItemModal() {
  state = {
    ...state,
    selectedViewType: null,
    selectedViewItem: null,
    selectedFeatureId: null,
  };
  emit();
}

/**
 * Open modal / set selection (non-org views)
 * This is what the map calls when a pin is clicked in tax/geodata/cloud.
 */
export function openViewItemModal({ viewType, item, featureId }) {
  const vt = String(viewType || "").toLowerCase();
  const normalizedType = vt === "tax" || vt === "geodata" || vt === "cloud" ? vt : null;

  state = {
    ...state,
    selectedViewType: normalizedType,
    selectedViewItem: item ?? null,
    selectedFeatureId: featureId == null ? null : String(featureId),
  };
  emit();
}

/**
 * View switching helper.
 *
 * RULES:
 * - salesRegions + countries persist across ALL views
 * - when leaving ORGS view, clear cities/orgIds/locationIds (org-only filters)
 * - when leaving CLOUD view, clear cloudProviders (cloud-only filter)
 * - clear any active modal selection when switching views (so you never see stale info)
 */
export function setViewMode(viewMode) {
  const vm = String(viewMode || "orgs").toLowerCase();
  const nextMode = vm === "tax" || vm === "geodata" || vm === "cloud" ? vm : "orgs";

  const prevMode = state.viewMode || "orgs";
  const next = { ...state, viewMode: nextMode };

  // leaving orgs -> clear org-only filters
  if (prevMode === "orgs" && nextMode !== "orgs") {
    next.cities = new Set();
    next.orgIds = new Set();
    next.locationIds = new Set();
    // locationScope can remain; harmless + keeps consistent if you bounce back
  }

  // leaving cloud -> clear cloud-only filters
  if (prevMode === "cloud" && nextMode !== "cloud") {
    next.cloudProviders = new Set();
  }

  // switching any view -> clear modal selection + highlight
  next.selectedViewType = null;
  next.selectedViewItem = null;
  next.selectedFeatureId = null;

  state = next;
  emit();
}

/**
 * Clear only org-only filters (useful for UI buttons in orgs view)
 */
export function clearOrgViewFilters() {
  state = {
    ...state,
    cities: new Set(),
    orgIds: new Set(),
    locationIds: new Set(),
  };
  emit();
}

/**
 * Full reset (including viewMode)
 */
export function resetVisualizeFilters() {
  state = {
    ...DEFAULT_STATE,
    salesRegions: new Set(),
    countries: new Set(),
    cloudProviders: new Set(),
    cities: new Set(),
    orgIds: new Set(),
    locationIds: new Set(),
    selectedViewType: null,
    selectedViewItem: null,
    selectedFeatureId: null,
  };
  emit();
}

export function toggleFilterValue(key, value) {
  const v = String(value ?? "").trim();
  if (!v) return;

  const next = { ...state };
  const current = next[key];

  if (!(current instanceof Set)) return;

  const target = cloneSet(current);
  if (target.has(v)) target.delete(v);
  else target.add(v);

  next[key] = target;
  state = next;
  emit();
}

/**
 * Build query params for the main orgs table route (/participants/organizations)
 *
 * NOTE:
 * - Still intentionally does NOT add orgIds by default (unless includeOrgIds=true).
 */
export function buildMainOrgsUrlFromFilters(
  basePath = "/participants/organizations",
  filters = state,
  { includeOrgIds = false, orgIdParam = "ORG_ID" } = {}
) {
  const p = new URLSearchParams();

  if (filters.salesRegions?.size)
    p.set("SALES_REGION", Array.from(filters.salesRegions).join(","));
  if (filters.countries?.size)
    p.set("GEONAME_COUNTRY_NAME", Array.from(filters.countries).join(","));
  if (filters.cities?.size) p.set("CITY", Array.from(filters.cities).join(","));

  // optional org drilldown (ONLY when enabled)
  if (includeOrgIds && filters.orgIds?.size) {
    p.set(orgIdParam, Array.from(filters.orgIds).join(","));
  }

  // keep scope consistent with backend locations summary behavior
  p.set("locationScope", filters.locationScope || "all");

  const qs = p.toString();
  return `${basePath}${qs ? `?${qs}` : ""}`;
}

export function useVisualizeFilters() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => state
  );
}
