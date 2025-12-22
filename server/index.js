import express from "express";
import fs from "fs";
import path from "path";
import Papa from "papaparse";
import crypto from "crypto";

const app = express();
app.use("/api", (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
const PORT = 5175;

// Fields that contain comma-separated tokens and should be treated as token lists
const TOKEN_FIELDS = new Set([
  "SERVICES",
  "INFRASTRUCTURE_TOOLS",
  "CONTENT_TYPES",
  "GEONAME_COUNTRY_NAME",
  "SALES_REGION",
  "ORG_FUNCTIONAL_TYPE",
  // Locations-derived fields (from LOCATIONS.csv)
  "ORG_LOCATION_CITIES",
  "ORG_LOCATION_COUNTRIES",
  "ORG_LOCATION_SALES_REGIONS",
]);

const YEAR_FLOOR = 1900;

/* ----------------------- helpers ----------------------- */
function normalize(s) {
  return String(s || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function splitTokens(value, delim = /,\s*/) {
  if (!value) return [];
  return String(value)
    .split(delim)
    .map((t) => t.trim())
    .filter(Boolean);
}

// Normalize content type tokens:
// - UI often uses taxonomy labels like "Advertising", "Episodic"
// - orgs.csv may store "Advertising Content", "Scripted Content"
function normalizeContentTypeToken(tok) {
  const t = String(tok || "").trim();
  if (!t) return "";
  return t.toLowerCase().endsWith(" content")
    ? t.slice(0, -(" content".length)).trim()
    : t;
}

// Services: keep the same *style* of normalization pipeline as content types
// (trim + collapse whitespace), but DO NOT strip suffixes like "Services"
// because labels like "Post-Production Services" are legitimate service names.
function normalizeServiceToken(tok) {
  return String(tok || "").trim().replace(/\s+/g, " ");
}

function parseNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseCSVFilterValue(value) {
  if (value == null) return [];
  // Express may give arrays if the query repeats. String([...]) becomes "a,b" which is fine.
  // IMPORTANT: some values (like pricing) contain thousands separators (e.g., "$10,001+").
  // We split only on commas that are NOT followed by a digit, so "$10,001+" stays intact.
  return String(value)
    .split(/,(?!\d)/)
    .map((v) => v.trim())
    .filter(Boolean);
}


function parseExactOrList(field, rawValue, rows) {
  // Some exact-match fields may legitimately contain commas (e.g., "Autodesk, Inc.").
  // Our default multi-select encoding uses commas, so naive splitting would break these values.
  // Strategy:
  // 1) If the raw value (as a whole) exactly matches any existing value for this field (case-insensitive),
  //    treat it as a single selection.
  // 2) Otherwise, fall back to CSV-style splitting.
  const whole = String(rawValue ?? "").trim();
  if (!whole) return [];

  // Only apply to exact-match (non-token) fields.
  if (!INFRA_TOKEN_FIELDS.has(field)) {
    const target = normalize(whole);
    for (const r of rows || []) {
      const v = r?.[field];
      if (!v) continue;
      if (normalize(v) === target) return [whole];
    }
  }

  return parseCSVFilterValue(rawValue);
}


function stableLocationId(input) {
  // Deterministic + compact. Collisions are extremely unlikely for our dataset size.
  return crypto.createHash("sha1").update(String(input)).digest("hex").slice(0, 16);
}

/* ---------- Sizing sort (numeric, not alphabetic) ---------- */
function sizingLowerBound(s) {
  const str = String(s || "").trim();
  const m = str.match(/^(\d+)\s*[-–]/);
  if (m) return Number(m[1]);
  const any = str.match(/(\d+)/);
  if (any) return Number(any[1]);
  return Number.POSITIVE_INFINITY;
}

function sortValues(field, values) {
  if (field === "ORG_SIZING" || field === "ORG_SIZING_CALCULATED") {
    return values.sort((a, b) => {
      const da = sizingLowerBound(a);
      const db = sizingLowerBound(b);
      if (da !== db) return da - db;
      return String(a).localeCompare(String(b));
    });
  }
  return values.sort((a, b) => String(a).localeCompare(String(b)));
}

/* ----------------------- load csvs ----------------------- */
const orgsCsvPath = path.resolve("data/orgs.csv");
const orgsCsvFile = fs.readFileSync(orgsCsvPath, "utf8");
const { data: ORGS_RAW } = Papa.parse(orgsCsvFile, {
  header: true,
  skipEmptyLines: true,
});
const ORGS = (ORGS_RAW || []).map((row, idx) => ({ id: idx + 1, ...row }));

// Load production locations and enrich ORGS with city/country/region token fields.
// LOCATIONS.csv is one row per (org, location).
const locationsPathCandidates = [
  path.resolve("data/LOCATIONS.csv"),
  path.resolve("data/locations.csv"),
];

let LOCATIONS = [];
for (const p of locationsPathCandidates) {
  try {
    if (fs.existsSync(p)) {
      const csv = fs.readFileSync(p, "utf8");
      const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
      LOCATIONS = (parsed.data || []).map((r, idx) => ({ id: idx + 1, ...r }));
      break;
    }
  } catch (e) {
    console.error(`⚠️ Failed to load locations from ${p}:`, e);
  }
}

// Stable ids for location rows (used for map selection → org filtering).
// We compute this once at startup so ids are consistent across endpoints.
const LOCATION_ID_TO_ORG_ID = new Map();
for (const row of LOCATIONS) {
  const orgId = String(row.ORG_ID ?? "").trim();
  if (!orgId) continue;

  const latRaw = row.LATITUDE ?? row.lat ?? row.Latitude ?? row.LAT;
  const lngRaw = row.LONGITUDE ?? row.lng ?? row.Longitude ?? row.LON ?? row.lon ?? row.LNG;
  const latitude = Number(latRaw);
  const longitude = Number(lngRaw);

  // Include even if coords are missing; id still stable, but only rows with valid coords show on the map.
  const salesRegion = String(row.SALES_REGION ?? "").trim();
  const countryName = String(row.GEONAME_COUNTRY_NAME ?? "").trim();
  const city = String(row.CITY ?? "").trim();
  const isHQ = normalize(row.HEADQUARTERS) === "true";

  const key = [
    orgId,
    Number.isFinite(latitude) ? latitude.toFixed(6) : "",
    Number.isFinite(longitude) ? longitude.toFixed(6) : "",
    isHQ ? "hq" : "nhq",
    salesRegion,
    countryName,
    city,
  ].join("|");

  const locationId = stableLocationId(key);
  row.LOCATION_ID = locationId;
  LOCATION_ID_TO_ORG_ID.set(locationId, orgId);
}

// Build per-org location sets + HQ city (for table display + filtering)
const LOC_BY_ORG_ID = new Map();
for (const row of LOCATIONS) {
  const orgId = String(row.ORG_ID ?? "").trim();
  if (!orgId) continue;

  const bucket = LOC_BY_ORG_ID.get(orgId) ?? {
    cities: new Set(),
    countries: new Set(),
    salesRegions: new Set(),
    hqCity: "",
  };

  const city = String(row.CITY ?? "").trim();
  const countryName = String(row.GEONAME_COUNTRY_NAME ?? "").trim();
  const salesRegion = String(row.SALES_REGION ?? "").trim();
  const isHq = normalize(row.HEADQUARTERS) === "true";

  if (city) bucket.cities.add(city);
  if (countryName) bucket.countries.add(countryName);
  if (salesRegion) bucket.salesRegions.add(salesRegion);

  // Prefer an explicit HQ city if present.
  if (isHq && city && !bucket.hqCity) bucket.hqCity = city;

  LOC_BY_ORG_ID.set(orgId, bucket);
}

// Enrich org rows (so the UI can display + filter by cities)
for (const org of ORGS) {
  const orgId = String(org.ORG_ID ?? "").trim();
  const bucket = LOC_BY_ORG_ID.get(orgId);

  const cities = bucket ? Array.from(bucket.cities) : [];
  const countries = bucket ? Array.from(bucket.countries) : [];
  const regions = bucket ? Array.from(bucket.salesRegions) : [];

  org.ORG_HQ_CITY = bucket?.hqCity || "";
  // Token fields (comma-separated strings)
  org.ORG_LOCATION_CITIES = cities.join(", ");
  org.ORG_LOCATION_COUNTRIES = countries.join(", ");
  org.ORG_LOCATION_SALES_REGIONS = regions.join(", ");
}

const identifiersPath = path.resolve("data/identifiers.csv");
let IDENTIFIERS = [];
try {
  if (fs.existsSync(identifiersPath)) {
    const identifiersCsv = fs.readFileSync(identifiersPath, "utf8");
    const parsed = Papa.parse(identifiersCsv, {
      header: true,
      skipEmptyLines: true,
    });
    IDENTIFIERS = (parsed.data || []).map((r, idx) => ({ id: idx + 1, ...r }));
  }
} catch (e) {
  console.error("⚠️ Failed to load identifiers.csv:", e);
  IDENTIFIERS = [];
}

const IDENTIFIERS_BY_ORG_ID = new Map();
for (const row of IDENTIFIERS) {
  const orgId = String(row.ORG_ID ?? "").trim();
  if (!orgId) continue;
  const arr = IDENTIFIERS_BY_ORG_ID.get(orgId) ?? [];
  arr.push({
    ORG_ID: orgId,
    ORG_NAME: row.ORG_NAME ?? "",
    ORG_DOMAIN: row.ORG_DOMAIN ?? "",
    ORG_IDENTIFIER_EXTERNAL_URL: row.ORG_IDENTIFIER_EXTERNAL_URL ?? "",
  });
  IDENTIFIERS_BY_ORG_ID.set(orgId, arr);
}


/* ----------------------- load infra catalog ----------------------- */
// Infrastructure catalog (infra.csv). We accept multiple candidate filenames for back-compat.
const infraPathCandidates = [
  path.resolve("data/infra.csv"),
  path.resolve("data/INFRA.csv"),
  path.resolve("data/infra_catalog.csv"),
  path.resolve("data/PLAYGROUND_OCT_2025_2025-12-20-1827.csv"),
];

let INFRA = [];
let INFRA_CSV_PATH = "";
for (const p of infraPathCandidates) {
  try {
    if (fs.existsSync(p)) {
      const csv = fs.readFileSync(p, "utf8");
      const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
      INFRA = (parsed.data || []).map((r, idx) => ({ id: idx + 1, ...r }));
      INFRA_CSV_PATH = p;
      break;
    }
  } catch (e) {
    console.error(`⚠️ Failed to load infra catalog from ${p}:`, e);
  }
}

if (!INFRA.length) {
  console.warn("⚠️ No infra catalog loaded. Expected one of:", infraPathCandidates);
}

const INFRA_COMMA_SPACE_FIELDS = new Set(["INFRA_LICENSE", "INFRA_YEARLY_CORPORATE_PRICING"]);
const INFRA_TOKEN_FIELDS = new Set([
  "INFRA_LICENSE",
  "INFRA_YEARLY_CORPORATE_PRICING",
  "INFRA_RELATED_SERVICES",
  "INFRA_RELATED_CONTENT_TYPES",
]);

function parseYearLoose(v) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  // If it's already a number-like string (e.g., "2012"), this works.
  const m = s.match(/(19\d{2}|20\d{2})/);
  if (!m) return null;
  const y = Number(m[1]);
  return Number.isFinite(y) ? y : null;
}

function scoreInfraName(infraName, q) {
  const name = normalize(infraName);
  const query = normalize(q);
  if (!query) return 0;
  if (!name) return -1;

  if (name === query) return 1000;
  if (name.startsWith(query)) return 800;
  if (name.includes(query)) return 600;

  const qTokens = query.split(" ").filter(Boolean);
  let hits = 0;
  for (const t of qTokens) if (name.includes(t)) hits += 1;
  return hits > 0 ? 400 + hits * 25 : -1;
}


function pricingSortKey(s) {
  const v = String(s || "").trim();
  if (!v) return { group: 9, num: Number.POSITIVE_INFINITY, text: "" };

  const upper = v.toUpperCase();

  // Put these first
  if (upper === "FREE") return { group: 0, num: -1, text: v };
  if (upper === "CONSUMPTION") return { group: 8, num: Number.POSITIVE_INFINITY, text: v };
  if (upper === "END_OF_LIFE") return { group: 10, num: Number.POSITIVE_INFINITY, text: v };

  // ≤ $100 etc.
  if (v.includes("≤") || v.includes("<=")) return { group: 1, num: 0, text: v };

  // Extract first numeric value from the string (handles $1,001 – $5,000, $10,001+, $101 – $500)
  const m = v.match(/\$?\s*([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)/);
  if (m) {
    const n = Number(String(m[1]).replace(/,/g, ""));
    if (!Number.isNaN(n)) return { group: 2, num: n, text: v };
  }

  // Fallback alphabetical
  return { group: 9, num: Number.POSITIVE_INFINITY, text: v };
}

function getUniqueInfraValues(field) {
  const set = new Set();

  for (const row of INFRA) {
    const v = row?.[field];
    if (!v) continue;

    if (INFRA_TOKEN_FIELDS.has(field)) {
      for (const tok of splitTokens(v)) set.add(tok);
    } else {
      set.add(String(v));
    }
  }

  const out = Array.from(set).filter(Boolean);

  if (field === "INFRA_YEARLY_CORPORATE_PRICING") {
    return out.sort((a, b) => {
      const ka = pricingSortKey(a);
      const kb = pricingSortKey(b);
      if (ka.group !== kb.group) return ka.group - kb.group;
      if (ka.num !== kb.num) return ka.num - kb.num;
      return ka.text.localeCompare(kb.text);
    });
  }

  return out.sort((a, b) => String(a).localeCompare(String(b)));
}
/* ----------------------- filter metadata ----------------------- */
function getUniqueValues(field) {
  const set = new Set();

  for (const org of ORGS) {
    const v = org?.[field];
    if (!v) continue;

    if (TOKEN_FIELDS.has(field)) {
      for (const tok of splitTokens(v)) {
        if (field === "CONTENT_TYPES") {
          const norm = normalizeContentTypeToken(tok);
          if (norm) set.add(norm);
        } else {
          set.add(tok);
        }
      }
    } else {
      set.add(String(v));
    }
  }

  const out = Array.from(set).filter(Boolean);
  return sortValues(field, out);
}

/* ----------------------- search ranking ----------------------- */
function scoreOrgName(orgName, q) {
  const name = normalize(orgName);
  const query = normalize(q);
  if (!query) return 0;
  if (!name) return -1;

  if (name === query) return 1000;
  if (name.startsWith(query)) return 800;
  if (name.includes(query)) return 600;

  const qTokens = query.split(" ").filter(Boolean);
  let hits = 0;
  for (const t of qTokens) if (name.includes(t)) hits += 1;
  return hits > 0 ? 400 + hits * 25 : -1;
}

/* ----------------------- routes ----------------------- */
app.get("/api/health", (_req, res) => res.json({ ok: true }));

/**
 * GET /api/locations/tree
 * Returns hierarchy for Production Locations Search View:
 * Sales Region → Country → City, with unique org counts at each level.
 */
app.get("/api/locations/tree", (_req, res) => {
  // regionKey -> { salesRegion, total:Set, hq:Set, countries: Map }
  const regions = new Map();

  for (const row of LOCATIONS) {
    const orgId = String(row.ORG_ID ?? "").trim();
    if (!orgId) continue;

    const salesRegion = String(row.SALES_REGION ?? "").trim() || "Unknown";
    const countryName = String(row.GEONAME_COUNTRY_NAME ?? "").trim() || "Unknown";
    const countryId = String(row.GEONAME_COUNTRY_ID ?? "").trim();
    const countryCode = String(row.COUNTRY ?? "").trim();
    const city = String(row.CITY ?? "").trim() || "Unknown";
    const isHq = normalize(row.HEADQUARTERS) === "true";

    let r = regions.get(salesRegion);
    if (!r) {
      r = { salesRegion, total: new Set(), hq: new Set(), countries: new Map() };
      regions.set(salesRegion, r);
    }
    r.total.add(orgId);
    if (isHq) r.hq.add(orgId);

    let c = r.countries.get(countryName);
    if (!c) {
      c = {
        countryName,
        geonameCountryId: countryId,
        countryCode,
        total: new Set(),
        hq: new Set(),
        cities: new Map(),
      };
      r.countries.set(countryName, c);
    }
    c.total.add(orgId);
    if (isHq) c.hq.add(orgId);

    let ct = c.cities.get(city);
    if (!ct) {
      ct = { city, total: new Set(), hq: new Set() };
      c.cities.set(city, ct);
    }
    ct.total.add(orgId);
    if (isHq) ct.hq.add(orgId);
  }

  const regionOrder = [
    "North America (NA)",
    "Latin America (LATAM)",
    "Europe - Middle East - Africa (EMEA)",
    "Asia Pacific (APAC)",
  ];

  const out = Array.from(regions.values())
    .sort((a, b) => {
      const ia = regionOrder.indexOf(a.salesRegion);
      const ib = regionOrder.indexOf(b.salesRegion);
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      return a.salesRegion.localeCompare(b.salesRegion);
    })
    .map((r) => {
      const countries = Array.from(r.countries.values())
        .sort((a, b) => a.countryName.localeCompare(b.countryName))
        .map((c) => {
          const cities = Array.from(c.cities.values())
            .sort((a, b) => a.city.localeCompare(b.city))
            .map((ct) => ({
              // Back-compat alias: some UI code expects `name`
              name: ct.city,
              city: ct.city,
              totalOrgs: ct.total.size,
              hqOrgs: ct.hq.size,
            }));

          return {
            // Back-compat alias: some UI code expects `name`
            name: c.countryName,
            countryName: c.countryName,
            geonameCountryId: c.geonameCountryId,
            countryCode: c.countryCode,
            totalOrgs: c.total.size,
            hqOrgs: c.hq.size,
            cities,
          };
        });

      return {
        // Back-compat alias: some UI code expects `name`
        name: r.salesRegion,
        salesRegion: r.salesRegion,
        totalOrgs: r.total.size,
        hqOrgs: r.hq.size,
        countries,
      };
    });

  res.json({ regions: out, totalLocationRows: LOCATIONS.length });
});

/**
 * GET /api/locations/points
 * Returns flat production-location rows with lat/lng for Map view.
 *
 * Each item:
 *  - orgId, orgName
 *  - salesRegion, countryName, city
 *  - latitude, longitude
 *  - isHQ
 */
app.get("/api/locations/points", (_req, res) => {
  // ORG_ID -> ORG_NAME lookup
  const nameByOrgId = new Map();
  for (const o of ORGS) {
    const id = String(o.ORG_ID ?? "").trim();
    if (!id) continue;
    if (!nameByOrgId.has(id)) nameByOrgId.set(id, String(o.ORG_NAME ?? "").trim());
  }

  const points = [];
  for (const row of LOCATIONS) {
    const orgId = String(row.ORG_ID ?? "").trim();
    if (!orgId) continue;

    const latRaw = row.LATITUDE ?? row.lat ?? row.Latitude ?? row.LAT;
    const lngRaw = row.LONGITUDE ?? row.lng ?? row.Longitude ?? row.LON ?? row.lon ?? row.LNG;

    const latitude = Number(latRaw);
    const longitude = Number(lngRaw);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;

    const salesRegion = String(row.SALES_REGION ?? "").trim() || "Unknown";
    const countryName = String(row.GEONAME_COUNTRY_NAME ?? "").trim() || "Unknown";
    const city = String(row.CITY ?? "").trim() || "Unknown";
    const isHQ = normalize(row.HEADQUARTERS) === "true";

    points.push({
      locationId: String(row.LOCATION_ID ?? ""),
      orgId,
      orgName: nameByOrgId.get(orgId) || "",
      salesRegion,
      countryName,
      city,
      latitude,
      longitude,
      isHQ,
    });
  }

  res.json(points);
});


// ---------- Location summary endpoints (Region / Country profiles) ----------
function countTokensForSubset(subset, field) {
  const counts = new Map();
  for (const org of subset) {
    const tokens = splitTokens(org[field]);
    for (const t of tokens) {
      const key = t.trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  return counts;
}

function topNFromMap(map, n = 10) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, count]) => ({ name, count }));
}

function subsetByRegion(regionName, scope = "all") {
  const r = normalize(regionName);
  if (!r) return [];
  return ORGS.filter((org) => {
    const orgId = String(org.ORG_ID);
    const loc = LOC_BY_ORG_ID.get(orgId);
    if (scope === "hq") return normalize(org.SALES_REGION) === r;
    return normalize(org.SALES_REGION) === r || (loc?.salesRegions && [...loc.salesRegions].some((x) => normalize(x) === r));
  });
}

function subsetByCountry(countryName, scope = "all") {
  const c = normalize(countryName);
  if (!c) return [];
  return ORGS.filter((org) => {
    const orgId = String(org.ORG_ID);
    const loc = LOC_BY_ORG_ID.get(orgId);
    if (scope === "hq") return normalize(org.GEONAME_COUNTRY_NAME) === c;
    return normalize(org.GEONAME_COUNTRY_NAME) === c || (loc?.countries && [...loc.countries].some((x) => normalize(x) === c));
  });
}

function orgIds(set) {
  return new Set([...set].map((x) => String(x)));
}

app.get("/api/locations/regions/:region/summary", (req, res) => {
  const scope = String(req.query.locationScope || req.query.scope || "all").toLowerCase() === "hq" ? "hq" : "all";
  const region = req.params.region;
  const subset = subsetByRegion(region, scope);

  const subsetIds = new Set(subset.map((o) => String(o.ORG_ID)));

  // Countries + cities for this region (from LOCATIONS rows)
  const countryAgg = new Map(); // country -> { geonameId, orgs:Set, hq:Set, cities: Map(city -> {orgs:Set, hq:Set}) }
  for (const row of LOCATIONS) {
    const orgId = String(row.ORG_ID || row.ORG_ID?.toString?.() || "");
    if (!subsetIds.has(orgId)) continue;

    const countryName = String(row.GEONAME_COUNTRY_NAME || "").trim();
    const countryId = String(row.GEONAME_COUNTRY_ID || "").trim();
    const city = String(row.CITY || "").trim();
    const isHq = normalize(row.HEADQUARTERS) === "true";

    if (!countryName) continue;

    if (!countryAgg.has(countryName)) {
      countryAgg.set(countryName, {
        geonameId: countryId,
        orgs: new Set(),
        hq: new Set(),
        cities: new Map(),
      });
    }
    const c = countryAgg.get(countryName);
    c.orgs.add(orgId);
    if (isHq) c.hq.add(orgId);

    if (city) {
      if (!c.cities.has(city)) c.cities.set(city, { orgs: new Set(), hq: new Set() });
      const ct = c.cities.get(city);
      ct.orgs.add(orgId);
      if (isHq) ct.hq.add(orgId);
    }
  }

  const countries = [...countryAgg.entries()]
    .map(([name, v]) => ({
      name,
      geonameCountryId: v.geonameId || "",
      totalOrgs: v.orgs.size,
      hqOrgs: v.hq.size,
      cities: [...v.cities.entries()]
        .map(([city, cv]) => ({ name: city, totalOrgs: cv.orgs.size, hqOrgs: cv.hq.size }))
        .sort((a, b) => b.totalOrgs - a.totalOrgs)
        .slice(0, 12),
    }))
    .sort((a, b) => b.totalOrgs - a.totalOrgs);

  const topServices = topNFromMap(countTokensForSubset(subset, "SERVICES"), 12);
  const topContentTypes = topNFromMap(countTokensForSubset(subset, "CONTENT_TYPES"), 12);
  const topInfras = topNFromMap(countTokensForSubset(subset, "INFRASTRUCTURE_TOOLS"), 12);
  const topFunctionalTypes = topNFromMap(countTokensForSubset(subset, "ORG_FUNCTIONAL_TYPE"), 10);

  res.json({
    scope,
    region,
    totals: {
      totalOrgs: subset.length,
      hqOrgs: subset.filter((o) => normalize(o.SALES_REGION) === normalize(region)).length, // HQ region match (best available)
      countries: countries.length,
      // approximate city count from LOCATIONS within subset
      cities: new Set(LOCATIONS.filter((r) => subsetIds.has(String(r.ORG_ID || ""))).map((r) => String(r.CITY || "").trim()).filter(Boolean)).size,
    },
    countries,
    topServices,
    topContentTypes,
    topInfras,
    topFunctionalTypes,
  });
});

app.get("/api/locations/countries/:country/summary", (req, res) => {
  const scope = String(req.query.locationScope || req.query.scope || "all").toLowerCase() === "hq" ? "hq" : "all";
  const country = req.params.country;

  const subset = subsetByCountry(country, scope);
  const subsetIds = new Set(subset.map((o) => String(o.ORG_ID)));

  // cities
  const cityAgg = new Map(); // city -> {orgs:Set, hq:Set}
  let geonameCountryId = "";
  for (const row of LOCATIONS) {
    const orgId = String(row.ORG_ID || "");
    if (!subsetIds.has(orgId)) continue;

    const countryName = String(row.GEONAME_COUNTRY_NAME || "").trim();
    if (normalize(countryName) !== normalize(country)) continue;

    if (!geonameCountryId) geonameCountryId = String(row.GEONAME_COUNTRY_ID || "").trim();

    const city = String(row.CITY || "").trim();
    const isHq = normalize(row.HEADQUARTERS) === "true";
    if (!city) continue;

    if (!cityAgg.has(city)) cityAgg.set(city, { orgs: new Set(), hq: new Set() });
    const c = cityAgg.get(city);
    c.orgs.add(orgId);
    if (isHq) c.hq.add(orgId);
  }

  const cities = [...cityAgg.entries()]
    .map(([name, v]) => ({ name, totalOrgs: v.orgs.size, hqOrgs: v.hq.size }))
    .sort((a, b) => b.totalOrgs - a.totalOrgs);

  const topServices = topNFromMap(countTokensForSubset(subset, "SERVICES"), 12);
  const topContentTypes = topNFromMap(countTokensForSubset(subset, "CONTENT_TYPES"), 12);
  const topInfras = topNFromMap(countTokensForSubset(subset, "INFRASTRUCTURE_TOOLS"), 12);
  const topFunctionalTypes = topNFromMap(countTokensForSubset(subset, "ORG_FUNCTIONAL_TYPE"), 10);

  res.json({
    scope,
    country,
    geonameCountryId,
    totals: {
      totalOrgs: subset.length,
      hqOrgs: subset.filter((o) => normalize(o.GEONAME_COUNTRY_NAME) === normalize(country)).length,
      cities: cities.length,
    },
    cities,
    topServices,
    topContentTypes,
    topInfras,
    topFunctionalTypes,
  });
});


/**
 * GET /api/orgs
 * Query params:
 *  - q, page, pageSize
 *  - ORG_ACTIVE_AS_OF_YEAR_MIN / ORG_ACTIVE_AS_OF_YEAR_MAX
 *  - CT_MATCH=any|all (applies to CONTENT_TYPES only)
 *  - any other field key = comma-separated values (multi-select)
 */
app.get("/api/orgs", (req, res) => {
  const {
    q = "",
    page = 1,
    pageSize = 25,
    CT_MATCH = "any",
    ORG_ACTIVE_AS_OF_YEAR_MIN,
    ORG_ACTIVE_AS_OF_YEAR_MAX,
    locationScope = "hq",
    locationIds,
    CITY,
    ...rawFilters
  } = req.query;

  const scope = String(locationScope || "hq").toLowerCase() === "all" ? "all" : "hq";

  let results = [...ORGS];

  // Geo selection filter (Map selection → Orgs page):
  // When locationIds is present, restrict results to orgs that have at least one selected location.
  // This is intentionally independent from CITY/COUNTRY/REGION string filters.
  if (locationIds) {
    const ids = parseCSVFilterValue(locationIds);
    const selectedOrgIds = new Set();
    for (const id of ids) {
      const orgId = LOCATION_ID_TO_ORG_ID.get(String(id));
      if (orgId) selectedOrgIds.add(String(orgId));
    }
    results = results.filter((org) => selectedOrgIds.has(String(org.ORG_ID ?? "").trim()));
  }

  // Year range filtering (ignore < 1900)
  const minRaw = parseNum(ORG_ACTIVE_AS_OF_YEAR_MIN);
  const maxRaw = parseNum(ORG_ACTIVE_AS_OF_YEAR_MAX);
  const min = minRaw && minRaw >= 1900 ? minRaw : null;
  const max = maxRaw && maxRaw >= 1900 ? maxRaw : null;
  if (min != null || max != null) {
    results = results.filter((org) => {
      const y = parseNum(org.ORG_ACTIVE_AS_OF_YEAR);
      if (!y) return false;
      if (min != null && y < min) return false;
      if (max != null && y > max) return false;
      return true;
    });
  }

  const norm = (v) => normalize(String(v ?? ""));
  const setHasNorm = (setOrArr, value) => {
    const n = norm(value);
    if (!n) return false;
    if (!setOrArr) return false;
    if (Array.isArray(setOrArr)) return setOrArr.some((x) => norm(x) === n);
    // Set
    for (const x of setOrArr) if (norm(x) === n) return true;
    return false;
  };

  function matchesSalesRegion(org, region) {
    if (!region) return true;
    if (scope === "hq") return norm(org.SALES_REGION) === norm(region);
    // all-locations: HQ OR any location region
    const loc = LOC_BY_ORG_ID.get(String(org.ORG_ID));
    return norm(org.SALES_REGION) === norm(region) || setHasNorm(loc?.salesRegions, region);
  }

  function matchesCountry(org, countryName) {
    if (!countryName) return true;
    if (scope === "hq") return norm(org.GEONAME_COUNTRY_NAME) === norm(countryName);
    const loc = LOC_BY_ORG_ID.get(String(org.ORG_ID));
    return norm(org.GEONAME_COUNTRY_NAME) === norm(countryName) || setHasNorm(loc?.countries, countryName);
  }

  function matchesCity(org, city) {
    if (!city) return true;
    if (scope === "hq") return norm(org.ORG_HQ_CITY) === norm(city);
    const loc = LOC_BY_ORG_ID.get(String(org.ORG_ID));
    return norm(org.ORG_HQ_CITY) === norm(city) || setHasNorm(loc?.cities, city);
  }

  // Apply field filters
  for (const [field, rawValue] of Object.entries(rawFilters)) {
    if (rawValue == null || rawValue === "") continue;

    const selectedValues = parseCSVFilterValue(rawValue);
    if (selectedValues.length === 0) continue;

    // Special: canonical location filters are merged via scope
    if (field === "SALES_REGION") {
      results = results.filter((org) => selectedValues.some((v) => matchesSalesRegion(org, v)));
      continue;
    }
    if (field === "GEONAME_COUNTRY_NAME") {
      results = results.filter((org) => selectedValues.some((v) => matchesCountry(org, v)));
      continue;
    }

    if (TOKEN_FIELDS.has(field)) {
      const wantAll =
        field === "CONTENT_TYPES" && String(CT_MATCH).toLowerCase() === "all";

      const selectedNorm = new Set(
        selectedValues
          .map((v) =>
            field === "CONTENT_TYPES"
              ? normalizeContentTypeToken(v)
              : normalize(v)
          )
          .filter(Boolean)
      );

      results = results.filter((org) => {
        const tokens = splitTokens(org[field]);
        const normed = tokens.map((t) =>
          field === "CONTENT_TYPES"
            ? normalizeContentTypeToken(t)
            : normalize(t)
        );

        if (wantAll) {
          for (const s of selectedNorm) {
            if (!normed.includes(s)) return false;
          }
          return true;
        } else {
          return normed.some((t) => selectedNorm.has(t));
        }
      });
    } else {
      // Exact match fields
      const selectedNorm = new Set(selectedValues.map((v) => normalize(v)).filter(Boolean));
      results = results.filter((org) => selectedNorm.has(normalize(org[field])));
    }
  }

  // CITY filter (kept separate so it doesn't appear in the modal)
  if (CITY) {
    const cities = parseCSVFilterValue(CITY);
    results = results.filter((org) => cities.some((c) => matchesCity(org, c)));
  }

  // Apply name search + ranking
  const query = String(q || "").trim();
  if (query) {
    results = results
      .map((org) => ({ org, score: scoreOrgName(org.ORG_NAME, query) }))
      .filter((x) => x.score >= 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.org);
  }

  const total = results.length;
  const p = Math.max(1, Number(page) || 1);
  const ps = Math.max(1, Number(pageSize) || 25);
  const start = (p - 1) * ps;
  const end = start + ps;

  res.json({
    data: results.slice(start, end),
    total,
    page: p,
    pageSize: ps,
  });
});

app.get("/api/orgs/filters", (_req, res) => {
  // Keep the Filters modal clean: expose canonical org fields only.
  // LocationScope + CITY are query-only controls, not filter categories.
  // We also intentionally do NOT expose ORG_LOCATION_* helper fields here (they are derived from LOCATIONS.csv).
  const allowedFields = [
    "ORG_FUNCTIONAL_TYPE",
    "ORG_SIZING_CALCULATED",
    "ADJUSTED_EMPLOYEE_COUNT",
    "GEONAME_COUNTRY_NAME",
    "SALES_REGION",
    "SERVICES",
    "INFRASTRUCTURE_TOOLS",
    "CONTENT_TYPES",
    "PERSONA_SCORING",
    "ORG_ACTIVE_AS_OF_YEAR",
    "ORG_IS_ACTIVE",
    "ORG_LEGAL_FORM",
    "ORG_IS_ULTIMATE_PARENT",
    // HQ city is helpful, but we keep production-city filtering primarily via the Locations pages.
    "ORG_HQ_CITY",
  ];

  const filters = {};
  for (const field of allowedFields) {
    filters[field] = getUniqueValues(field);
  }
  res.json(filters);
});

app.get("/api/orgs/services/counts", (_req, res) => {
  const totalsByService = {};

  for (const org of ORGS) {
    const tokens = splitTokens(org?.SERVICES)
      .map(normalizeServiceToken)
      .map((t) => t.trim())
      .filter(Boolean);

    // Dedup within an org so repeated tokens don't double count
    const seen = new Set(tokens.map((t) => normalize(t)));
    for (const key of seen) {
      totalsByService[key] = (totalsByService[key] ?? 0) + 1;
    }
  }

  res.json({
    totalsByService,
    totalOrgs: ORGS.length,
  });
});

// Content Type counts (computed from orgs.csv CONTENT_TYPES column)
// Returns keys in normalized-lower form (same convention as services counts).
app.get("/api/orgs/content-types/counts", (_req, res) => {
  const totalsByType = {};

  for (const org of ORGS) {
    const tokens = splitTokens(org?.CONTENT_TYPES)
      .map(normalizeContentTypeToken)
      .map((t) => String(t || "").trim().replace(/\s+/g, " "))
      .filter(Boolean);

    // Dedup within an org so repeated tokens don't double count
    const seen = new Set(tokens.map((t) => normalize(t)));
    for (const key of seen) {
      totalsByType[key] = (totalsByType[key] ?? 0) + 1;
    }
  }

  res.json({
    totalsByType,
    totalOrgs: ORGS.length,
  });
});

app.get("/api/orgs/:orgId", (req, res) => {
  const orgId = String(req.params.orgId ?? "").trim();
  if (!orgId) return res.status(400).json({ error: "Missing orgId" });

  const org = ORGS.find((o) => String(o.ORG_ID ?? "").trim() === orgId);
  if (!org) return res.status(404).json({ error: "Organization not found" });

  const identifiers = IDENTIFIERS_BY_ORG_ID.get(orgId) ?? [];
  res.json({ ...org, identifiers });
});



/* ----------------------- infra routes ----------------------- */
/**
 * GET /api/infra
 * Query params:
 *  - q, page, pageSize
 *  - INFRA_RELEASE_YEAR_MIN / INFRA_RELEASE_YEAR_MAX
 *  - any other infra field = comma-separated values (multi-select)
 */
app.get("/api/infra", (req, res) => {
  const {
    q = "",
    page = 1,
    pageSize = 25,
    INFRA_RELEASE_YEAR_MIN,
    INFRA_RELEASE_YEAR_MAX,
    ...rawFilters
  } = req.query;

  let results = [...INFRA];

  // Year range (derived from INFRA_RELEASE_DATE)
  const minRaw = parseNum(INFRA_RELEASE_YEAR_MIN);
  const maxRaw = parseNum(INFRA_RELEASE_YEAR_MAX);
  const min = minRaw && minRaw >= YEAR_FLOOR ? minRaw : null;
  const max = maxRaw && maxRaw >= YEAR_FLOOR ? maxRaw : null;
  if (min != null || max != null) {
    results = results.filter((row) => {
      const y = parseYearLoose(row.INFRA_RELEASE_DATE);
      if (!y) return false;
      if (min != null && y < min) return false;
      if (max != null && y > max) return false;
      return true;
    });
  }

  // Apply field filters (exact OR token-list any-match)
  for (const [field, rawValue] of Object.entries(rawFilters)) {
    if (rawValue == null || rawValue === "") continue;

    const selectedValues = parseExactOrList(field, rawValue, INFRA);
    if (selectedValues.length === 0) continue;

    if (INFRA_TOKEN_FIELDS.has(field)) {
      const selectedNorm = new Set(selectedValues.map((v) => normalize(v)).filter(Boolean));
      results = results.filter((row) => {
        const tokens = splitTokens(row[field]);
        const normed = tokens.map((t) => normalize(t));
        return normed.some((t) => selectedNorm.has(t));
      });
    } else {
      const selectedNorm = new Set(selectedValues.map((v) => normalize(v)).filter(Boolean));
      results = results.filter((row) => selectedNorm.has(normalize(row[field])));
    }
  }

  // Search + ranking (by INFRA_NAME)
  const query = String(q || "").trim();
  if (query) {
    results = results
      .map((row) => ({ row, score: scoreInfraName(row.INFRA_NAME, query) }))
      .filter((x) => x.score >= 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.row);
  }

  const total = results.length;
  const p = Math.max(1, Number(page) || 1);
  const ps = Math.max(1, Number(pageSize) || 25);
  const start = (p - 1) * ps;
  const end = start + ps;

  res.json({
    data: results.slice(start, end),
    total,
    page: p,
    pageSize: ps,
    infraCatalogPath: INFRA_CSV_PATH ? path.basename(INFRA_CSV_PATH) : "",
  });
});

app.get("/api/infra/filters", (_req, res) => {
  const allowedFields = [
    "INFRA_IS_ACTIVE",
    "INFRA_HAS_API",
    "INFRA_PARENT_ORGANIZATION",
    "INFRA_LICENSE",
    "INFRA_FUNCTIONAL_TYPE",
    "INFRA_STRUCTURAL_TYPE",
    "INFRA_YEARLY_CORPORATE_PRICING",
    "INFRA_RELATED_SERVICES",
    "INFRA_RELATED_CONTENT_TYPES",
    
  ];

  const filters = {};
  for (const field of allowedFields) filters[field] = getUniqueInfraValues(field);

  res.json(filters);
});

// Orgs by infra selection (for Infra table view connectivity)
app.get("/api/infra/orgs", (req, res) => {
  const {
    infras,
    services,
    contentTypes,
    CT_MATCH = "any",
    page = 1,
    pageSize = 25,
    q = "",
    ...rest
  } = req.query;

  const infraList = parseCSVFilterValue(infras);
  if (infraList.length === 0) {
    return res.status(400).json({ error: "Missing required query param: infras" });
  }

  const infraNorm = new Set(infraList.map((x) => normalize(x)).filter(Boolean));

  // Start with orgs that have ANY of the selected infras
  let results = ORGS.filter((org) => {
    const tokens = splitTokens(org.INFRASTRUCTURE_TOOLS).map((t) => normalize(t));
    return tokens.some((t) => infraNorm.has(t));
  });

  // Optional intersection filters (services/content types)
  const serviceList = parseCSVFilterValue(services);
  if (serviceList.length) {
    const want = new Set(serviceList.map((v) => normalize(v)).filter(Boolean));
    results = results.filter((org) => {
      const tokens = splitTokens(org.SERVICES)
        .map(normalizeServiceToken)
        .map((t) => normalize(t));
      return tokens.some((t) => want.has(t));
    });
  }

  const ctList = parseCSVFilterValue(contentTypes);
  if (ctList.length) {
    const wantAll = String(CT_MATCH).toLowerCase() === "all";
    const want = new Set(ctList.map((v) => normalize(normalizeContentTypeToken(v))).filter(Boolean));
    results = results.filter((org) => {
      const tokens = splitTokens(org.CONTENT_TYPES)
        .map(normalizeContentTypeToken)
        .map((t) => normalize(t));

      if (wantAll) {
        for (const s of want) if (!tokens.includes(s)) return false;
        return true;
      }
      return tokens.some((t) => want.has(t));
    });
  }

  // (Optional) allow passing through some org filters as well (rest)
  // This keeps infra→org deep linking flexible without adding a second endpoint.
  for (const [field, rawValue] of Object.entries(rest)) {
    if (rawValue == null || rawValue === "") continue;
    if (!Object.prototype.hasOwnProperty.call(ORGS[0] || {}, field)) continue;

    const selectedValues = parseCSVFilterValue(rawValue);
    if (!selectedValues.length) continue;

    if (TOKEN_FIELDS.has(field)) {
      const wantAll = field === "CONTENT_TYPES" && String(CT_MATCH).toLowerCase() === "all";
      const selectedNorm = new Set(
        selectedValues
          .map((v) => (field === "CONTENT_TYPES" ? normalizeContentTypeToken(v) : v))
          .map((v) => normalize(v))
          .filter(Boolean)
      );

      results = results.filter((org) => {
        const tokens = splitTokens(org[field]).map((t) =>
          field === "CONTENT_TYPES" ? normalizeContentTypeToken(t) : t
        );
        const normed = tokens.map((t) => normalize(t));

        if (wantAll) {
          for (const s of selectedNorm) if (!normed.includes(s)) return false;
          return true;
        }
        return normed.some((t) => selectedNorm.has(t));
      });
    } else {
      const selectedNorm = new Set(selectedValues.map((v) => normalize(v)).filter(Boolean));
      results = results.filter((org) => selectedNorm.has(normalize(org[field])));
    }
  }

  // Optional org name search (reuse org scorer)
  const query = String(q || "").trim();
  if (query) {
    results = results
      .map((org) => ({ org, score: scoreOrgName(org.ORG_NAME, query) }))
      .filter((x) => x.score >= 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.org);
  }

  const total = results.length;
  const p = Math.max(1, Number(page) || 1);
  const ps = Math.max(1, Number(pageSize) || 25);
  const start = (p - 1) * ps;
  const end = start + ps;

  res.json({
    data: results.slice(start, end),
    total,
    page: p,
    pageSize: ps,
    selectedInfras: infraList,
  });
});

// Infra details
app.get("/api/infra/:infraName", (req, res) => {
  const infraName = String(req.params.infraName ?? "").trim();
  if (!infraName) return res.status(400).json({ error: "Missing infraName" });

  const infra = INFRA.find((r) => normalize(r.INFRA_NAME) === normalize(infraName));
  if (!infra) return res.status(404).json({ error: "Infrastructure not found" });

  // Compute related aggregates from orgs tagged with this infra.
  const infraNorm = normalize(infra.INFRA_NAME);
  const orgsWithInfra = ORGS.filter((org) => {
    const tokens = splitTokens(org.INFRASTRUCTURE_TOOLS).map((t) => normalize(t));
    return tokens.includes(infraNorm);
  });

  // Top services / content types (dedup within org)
  const serviceCounts = new Map();
  const contentCounts = new Map();

  for (const org of orgsWithInfra) {
    const services = new Set(
      splitTokens(org.SERVICES)
        .map(normalizeServiceToken)
        .map((t) => normalize(t))
        .filter(Boolean)
    );
    for (const s of services) serviceCounts.set(s, (serviceCounts.get(s) || 0) + 1);

    const cts = new Set(
      splitTokens(org.CONTENT_TYPES)
        .map(normalizeContentTypeToken)
        .map((t) => normalize(t))
        .filter(Boolean)
    );
    for (const c of cts) contentCounts.set(c, (contentCounts.get(c) || 0) + 1);
  }

  const topServices = topNFromMap(serviceCounts, 20);
  const topContentTypes = topNFromMap(contentCounts, 20);

  res.json({
    infra,
    orgCount: orgsWithInfra.length,
    topServices,
    topContentTypes,
  });
});
app.listen(PORT, () => {
  console.log(`✅ Org API running on http://localhost:${PORT}`);
});
