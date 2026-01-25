// src/services/locationsApi.js

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const LS_PREFIX = "me_nexus_cache_v1:";

function now() {
  return Date.now();
}

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

/**
 * LocalStorage cache record:
 * { t: number, v: any }
 */
function lsGet(key, ttlMs) {
  const raw = localStorage.getItem(LS_PREFIX + key);
  if (!raw) return null;
  const rec = safeJsonParse(raw);
  if (!rec || typeof rec.t !== "number") return null;
  if (now() - rec.t > ttlMs) return null;
  return rec.v ?? null;
}

function lsSet(key, value) {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify({ t: now(), v: value }));
  } catch {
    // ignore quota / disabled storage
  }
}

async function fetchJson(url, { signal } = {}) {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status} for ${url}${text ? `: ${text}` : ""}`);
  }
  return res.json();
}

// Simple in-memory cache (fastest path)
const mem = {
  tree: null,
  points: null,
  treeAt: 0,
  pointsAt: 0,
};

/**
 * GET /api/locations/tree
 */
export async function getLocationsTree({ ttlMs = DEFAULT_TTL_MS, signal } = {}) {
  // mem cache
  if (mem.tree && now() - mem.treeAt <= ttlMs) return mem.tree;

  // localStorage cache
  const cached = lsGet("locations_tree", ttlMs);
  if (cached) {
    mem.tree = cached;
    mem.treeAt = now();
    return cached;
  }

  const data = await fetchJson("/api/locations/tree", { signal });
  mem.tree = data;
  mem.treeAt = now();
  lsSet("locations_tree", data);
  return data;
}

/**
 * GET /api/locations/points
 * Backend shape (from server): [{ locationId, orgId, orgName, salesRegion, countryName, city, latitude, longitude, isHQ }]
 *
 * We normalize into:
 * {
 *   locationId, orgId, orgName, salesRegion, countryName, city,
 *   lat, lng, coords:[lng,lat], isHQ
 * }
 */
export async function getLocationPoints({ ttlMs = DEFAULT_TTL_MS, signal } = {}) {
  // mem cache
  if (mem.points && now() - mem.pointsAt <= ttlMs) return mem.points;

  // localStorage cache
  const cached = lsGet("locations_points", ttlMs);
  if (Array.isArray(cached)) {
    mem.points = cached;
    mem.pointsAt = now();
    return cached;
  }

  const raw = await fetchJson("/api/locations/points", { signal });
  const normalized = Array.isArray(raw)
    ? raw
        .map((r) => {
          const lat = Number(r?.latitude);
          const lng = Number(r?.longitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

          const salesRegion = String(r?.salesRegion ?? "Unknown").trim() || "Unknown";
          const countryName = String(r?.countryName ?? "Unknown").trim() || "Unknown";
          const city = String(r?.city ?? "Unknown").trim() || "Unknown";

          return {
            locationId: String(r?.locationId ?? "").trim(),
            orgId: String(r?.orgId ?? "").trim(),
            orgName: String(r?.orgName ?? "").trim(),
            salesRegion,
            countryName,
            city,
            lat,
            lng,
            coords: [lng, lat],
            isHQ: Boolean(r?.isHQ),
          };
        })
        .filter(Boolean)
    : [];

  mem.points = normalized;
  mem.pointsAt = now();
  lsSet("locations_points", normalized);
  return normalized;
}

/**
 * Aggregate points into map “pins”.
 *
 * mode:
 *  - "org": one pin per org-location row (lots of points)
 *  - "city": one pin per locationId (or fallback grouping), with orgCount
 */
/**
 * Aggregate points into map “pins”.
 *
 * mode:
 *  - "org": one pin per org-location row (lots of points)
 *  - "city": one pin per (salesRegion, country, city) with UNIQUE org counts
 */
export function buildPins(points, { mode = "city" } = {}) {
  if (!Array.isArray(points) || points.length === 0) return [];

  // Org mode: one point per row (already fine)
  if (mode === "org") {
    return points.map((p) => ({
      id: p.locationId || `${p.orgId}|${p.city}|${p.countryName}|${p.lat}|${p.lng}`,
      label: p.orgName || p.orgId || "Organization",
      salesRegion: p.salesRegion,
      countryName: p.countryName,
      city: p.city,
      coords: p.coords,
      // In org mode these are trivial + safe
      orgCount: 1,
      hqCount: p.isHQ ? 1 : 0,
      orgIds: p.orgId ? [p.orgId] : [],
      locationIds: p.locationId ? [p.locationId] : [],
    }));
  }

  // City mode: aggregate by city (NOT by locationId)
  const byCity = new Map();

  for (const p of points) {
    const salesRegion = String(p?.salesRegion ?? "Unknown");
    const countryName = String(p?.countryName ?? "Unknown");
    const city = String(p?.city ?? "Unknown");

    // City aggregation key
    const key = `${salesRegion}||${countryName}||${city}`;

    let agg = byCity.get(key);
    if (!agg) {
      agg = {
        id: key,
        label: city || "Unknown City",
        salesRegion,
        countryName,
        city,

        // centroid accumulators
        _lngSum: 0,
        _latSum: 0,
        _n: 0,

        // unique sets
        _orgIds: new Set(),
        _hqOrgIds: new Set(),
        _locationIds: new Set(),
      };
      byCity.set(key, agg);
    }

    // centroid
    if (Array.isArray(p.coords) && p.coords.length === 2) {
      const [lng, lat] = p.coords;
      if (Number.isFinite(lng) && Number.isFinite(lat)) {
        agg._lngSum += lng;
        agg._latSum += lat;
        agg._n += 1;
      }
    }

    if (p.orgId) agg._orgIds.add(String(p.orgId));
    if (p.isHQ && p.orgId) agg._hqOrgIds.add(String(p.orgId));
    if (p.locationId) agg._locationIds.add(String(p.locationId));
  }

  const pins = [];
  for (const agg of byCity.values()) {
    const n = agg._n || 1;
    const lng = agg._lngSum / n;
    const lat = agg._latSum / n;

    const orgIds = Array.from(agg._orgIds);
    const hqOrgIds = agg._hqOrgIds;

    pins.push({
      id: agg.id,
      label: agg.label,
      salesRegion: agg.salesRegion,
      countryName: agg.countryName,
      city: agg.city,
      coords: [lng, lat],

      // IMPORTANT: orgCount = unique orgs
      orgCount: orgIds.length,

      // IMPORTANT: hqCount = unique HQ orgs (not rows)
      hqCount: hqOrgIds.size,

      orgIds,
      locationIds: Array.from(agg._locationIds),
    });
  }

  // stable + useful ordering
  return pins.sort((a, b) => (b.orgCount || 0) - (a.orgCount || 0));
}

/**
 * Convenience helpers for dropdowns / filter lists
 */
export function extractFilterOptionsFromPoints(points) {
  const salesRegions = new Set();
  const countries = new Set();
  const cities = new Set();

  for (const p of points || []) {
    if (p.salesRegion) salesRegions.add(p.salesRegion);
    if (p.countryName) countries.add(p.countryName);
    if (p.city) cities.add(p.city);
  }

  return {
    salesRegions: [...salesRegions].sort(),
    countries: [...countries].sort(),
    cities: [...cities].sort(),
  };
}
