// src/hooks/useViewData.js
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Cached + abort-safe data fetcher for the 3 non-org views:
 * - tax regions
 * - geodata
 * - cloud regions
 *
 * Features:
 * - stale-while-revalidate (returns cached data instantly, then refreshes)
 * - abort-safe (won't setState after unmount / view change)
 * - simple in-memory cache with TTL + in-flight de-dupe
 *
 * Usage:
 *   const { rows, loading, error, refresh } = useViewRows(viewMode, filters)
 *   const { options, loading, error, refresh } = useViewFilterOptions(viewMode, filters)
 *
 * NOTE:
 * - For orgs view, this hook returns empty rows/options.
 */

// -----------------------------
// Cache + in-flight de-dupe
// -----------------------------
const DEFAULT_TTL_MS = 2 * 60 * 1000; // 2 minutes
const CACHE = new Map(); // key -> { ts, data }
const INFLIGHT = new Map(); // key -> Promise

function now() {
  return Date.now();
}

function setCache(key, data) {
  CACHE.set(key, { ts: now(), data });
}

function getCache(key, ttlMs = DEFAULT_TTL_MS) {
  const hit = CACHE.get(key);
  if (!hit) return null;
  if (now() - hit.ts > ttlMs) return null;
  return hit.data;
}

function stableSetToString(setLike) {
  try {
    if (!setLike || typeof setLike.size !== "number") return "";
    return Array.from(setLike)
      .map((x) => String(x))
      .sort()
      .join("|");
  } catch {
    return "";
  }
}

function buildQueryForView(viewMode, filters) {
  const sr = filters?.salesRegions?.size ? Array.from(filters.salesRegions).join(",") : "";
  const co = filters?.countries?.size ? Array.from(filters.countries).join(",") : "";
  const cp = filters?.cloudProviders?.size ? Array.from(filters.cloudProviders).join(",") : "";

  const qs = new URLSearchParams();

  if (viewMode === "tax") {
    if (sr) qs.set("SALES_REGION", sr);
    if (co) qs.set("COUNTRY", co);
    return qs.toString();
  }

  if (viewMode === "geodata") {
    if (sr) qs.set("SALES_REGION", sr);
    if (co) qs.set("GEONAME_COUNTRY_NAME", co);
    return qs.toString();
  }

  if (viewMode === "cloud") {
    // ✅ Cloud view now supports:
    // - SALES_REGION (derived via LOCATIONS country->region mapping on server)
    // - CLOUD_PROVIDER
    // - COUNTRY_NAME
    if (sr) qs.set("SALES_REGION", sr);
    if (co) qs.set("COUNTRY_NAME", co);
    if (cp) qs.set("CLOUD_PROVIDER", cp);
    return qs.toString();
  }

  return "";
}
const base = import.meta.env.VITE_API_BASE;
function endpointForRows(viewMode) {
  if (viewMode === "tax") return base+"/api/views/tax-regions";
  if (viewMode === "geodata") return base+"/api/views/geodata";
  if (viewMode === "cloud") return base+"/api/views/cloud-regions";
  return "";
}

function endpointForFilters(viewMode) {
  if (viewMode === "tax") return base+"/api/views/tax-regions/filters";
  if (viewMode === "geodata") return base+"/api/views/geodata/filters";
  if (viewMode === "cloud") return base+"/api/views/cloud-regions/filters";
  return "";
}

async function fetchJson(url, { signal } = {}) {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    const msg = `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return res.json();
}

/**
 * Cached fetch with in-flight de-dupe
 */
async function cachedFetch(key, url, { signal, ttlMs = DEFAULT_TTL_MS } = {}) {
  const cached = getCache(key, ttlMs);
  if (cached != null) return cached;

  // in-flight de-dupe
  if (INFLIGHT.has(key)) return INFLIGHT.get(key);

  const p = (async () => {
    try {
      const data = await fetchJson(url, { signal });
      setCache(key, data);
      return data;
    } finally {
      INFLIGHT.delete(key);
    }
  })();

  INFLIGHT.set(key, p);
  return p;
}

// -----------------------------
// Hooks
// -----------------------------
export function useViewRows(viewMode, filters, { ttlMs = DEFAULT_TTL_MS } = {}) {
  const vm = String(viewMode || "orgs").toLowerCase();
  const isSupported = vm === "tax" || vm === "geodata" || vm === "cloud";

  const key = useMemo(() => {
    if (!isSupported) return "rows:orgs";
    const srKey = stableSetToString(filters?.salesRegions);
    const coKey = stableSetToString(filters?.countries);
    const cpKey = stableSetToString(filters?.cloudProviders);
    return `rows:${vm}|sr:${srKey}|co:${coKey}|cp:${cpKey}`;
  }, [isSupported, vm, filters?.salesRegions, filters?.countries, filters?.cloudProviders]);

  const [rows, setRows] = useState(() => (isSupported ? getCache(key, ttlMs) || [] : []));
  const [loading, setLoading] = useState(isSupported ? !getCache(key, ttlMs) : false);
  const [error, setError] = useState("");

  const refreshRef = useRef(() => {});

  useEffect(() => {
    if (!isSupported) {
      setRows([]);
      setLoading(false);
      setError("");
      refreshRef.current = () => {};
      return;
    }

    const base = endpointForRows(vm);
    const qs = buildQueryForView(vm, filters);
    const url = qs ? `${base}?${qs}` : base;

    const ac = new AbortController();
    let alive = true;

    // SWR: set cached immediately if present, then revalidate
    const cached = getCache(key, ttlMs);
    if (cached != null) {
      setRows(cached || []);
      setLoading(false);
      setError("");
    } else {
      setLoading(true);
      setError("");
    }

    const run = async (force = false) => {
      try {
        if (force) setLoading(true);

        const data = await cachedFetch(force ? `${key}|force:${now()}` : key, url, {
          signal: ac.signal,
          ttlMs: force ? 0 : ttlMs,
        });

        if (!alive || ac.signal.aborted) return;
        setRows(Array.isArray(data) ? data : data?.rows || data?.data || []);
        setError("");
      } catch (e) {
        if (!alive || ac.signal.aborted) return;
        setError(e?.message || "Failed to load view rows");
      } finally {
        if (!alive || ac.signal.aborted) return;
        setLoading(false);
      }
    };

    // revalidate once (SWR)
    run(false);

    refreshRef.current = () => run(true);

    return () => {
      alive = false;
      ac.abort();
    };
  }, [isSupported, vm, key, ttlMs, filters]);

  return {
    rows,
    loading,
    error,
    refresh: () => refreshRef.current?.(),
  };
}

/**
 * Fetch filter options for the active non-org view.
 *
 * Expected shape from your server:
 * {
 *   salesRegions: [...],
 *   countries: [...],
 *   cloudProviders: [...], // (cloud only)
 *   ... view-specific options
 * }
 *
 * This hook just returns whatever the server returns, cached.
 */
export function useViewFilterOptions(viewMode, filters, { ttlMs = DEFAULT_TTL_MS } = {}) {
  const vm = String(viewMode || "orgs").toLowerCase();
  const isSupported = vm === "tax" || vm === "geodata" || vm === "cloud";

  const key = useMemo(() => {
    if (!isSupported) return "filters:orgs";
    const srKey = stableSetToString(filters?.salesRegions);
    const coKey = stableSetToString(filters?.countries);
    const cpKey = stableSetToString(filters?.cloudProviders);
    return `filters:${vm}|sr:${srKey}|co:${coKey}|cp:${cpKey}`;
  }, [isSupported, vm, filters?.salesRegions, filters?.countries, filters?.cloudProviders]);

  const [options, setOptions] = useState(() => (isSupported ? getCache(key, ttlMs) || null : null));
  const [loading, setLoading] = useState(isSupported ? !getCache(key, ttlMs) : false);
  const [error, setError] = useState("");

  const refreshRef = useRef(() => {});

  useEffect(() => {
    if (!isSupported) {
      setOptions(null);
      setLoading(false);
      setError("");
      refreshRef.current = () => {};
      return;
    }

    const base = endpointForFilters(vm);
    const qs = buildQueryForView(vm, filters);
    const url = qs ? `${base}?${qs}` : base;

    const ac = new AbortController();
    let alive = true;

    const cached = getCache(key, ttlMs);
    if (cached != null) {
      setOptions(cached);
      setLoading(false);
      setError("");
    } else {
      setLoading(true);
      setError("");
    }

    const run = async (force = false) => {
      try {
        if (force) setLoading(true);

        const data = await cachedFetch(force ? `${key}|force:${now()}` : key, url, {
          signal: ac.signal,
          ttlMs: force ? 0 : ttlMs,
        });

        if (!alive || ac.signal.aborted) return;
        setOptions(data || null);
        setError("");
      } catch (e) {
        if (!alive || ac.signal.aborted) return;
        setError(e?.message || "Failed to load view filter options");
      } finally {
        if (!alive || ac.signal.aborted) return;
        setLoading(false);
      }
    };

    run(false);
    refreshRef.current = () => run(true);

    return () => {
      alive = false;
      ac.abort();
    };
  }, [isSupported, vm, key, ttlMs, filters]);

  return {
    options,
    loading,
    error,
    refresh: () => refreshRef.current?.(),
  };
}

// Optional: cache controls (handy for debugging / dev tools)
export function clearViewDataCache() {
  CACHE.clear();
  INFLIGHT.clear();
}

