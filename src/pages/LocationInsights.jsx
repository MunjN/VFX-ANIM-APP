import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import InsightsShell from "../components/insights/InsightsShell";
import {
  StatCard,
  Card,
  CardGrid,
  TwoCol,
  Pill,
  Divider,
} from "../components/insights/Cards";
import BarChart from "../components/insights/BarChart";
import DonutChart from "../components/insights/DonutChart";
import PaginatedOrgTable from "../components/insights/PaginatedOrgTable";

const base = import.meta.env.VITE_API_BASE;

// -------------------- helpers --------------------
const ICONS = {
  globe: "🌍",
  map: "🗺️",
  city: "🏙️",
  orgs: "🏢",
  pin: "📍",
  tax: "🧾",
  pop: "👥",
  focus: "🎯",
  density: "📍",
};

const UNKNOWN_RE = /(^unknown$|hq unknown|unknown\s*•|^unknown\s*$)/i;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUnknownLabel(x) {
  const s = String(x ?? "").trim();
  return !s || UNKNOWN_RE.test(s);
}

function isBadLabel(x) {
  const s = String(x ?? "").trim();
  return !s || isUnknownLabel(s) || UUID_RE.test(s);
}

function fmtNum(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString();
}

function fmtPct(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return "0%";
  return `${n.toFixed(0)}%`;
}

function safeHTML(s) {
  return String(s ?? "")
    .replace(/\s+/g, " ")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function pct(part, total) {
  const p = Number(part) || 0;
  const t = Number(total) || 0;
  if (!t) return 0;
  return (p / t) * 100;
}

function asXY(list, xKeyName, yKeyName) {
  return (list || []).map((d) => ({
    [xKeyName]:
      d?.label ?? d?.name ?? d?.country ?? d?.city ?? d?.region ?? "",
    [yKeyName]: Number(d?.value ?? d?.count ?? d?.n ?? 0) || 0,
  }));
}

function barHeight(n, { min = 360, per = 54, max = 1040 } = {}) {
  const len = Number(n) || 0;
  const h = Math.round(Math.max(min, Math.min(max, len * per + 140)));
  return h;
}

function pickFirst(obj, keys = [], fallback = null) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null) return v;
  }
  return fallback;
}

function top1Share(list) {
  const first =
    Number((list || [])[0]?.value ?? (list || [])[0]?.count ?? 0) || 0;
  const total = (list || []).reduce(
    (s, x) => s + (Number(x?.value ?? x?.count ?? 0) || 0),
    0
  );
  return { first, total, share: pct(first, total) };
}

/**
 * Donut helper:
 * - removes Unknown labels completely
 * - rolls their counts into "Other"
 */
function withOtherExclusiveNoUnknown(list, total, topN, otherLabel = "Other") {
  const safe = (list || [])
    .map((x) => ({
      label: String(x?.label ?? x?.name ?? "").trim(),
      value: Number(x?.value ?? x?.count ?? 0) || 0,
    }))
    .filter((x) => x.label && x.value > 0);

  const unknownSum = safe
    .filter((x) => isUnknownLabel(x.label))
    .reduce((s, x) => s + x.value, 0);

  const known = safe.filter((x) => !isUnknownLabel(x.label));
  known.sort((a, b) => b.value - a.value);

  const top = known.slice(0, topN);
  const sumTop = top.reduce((s, x) => s + x.value, 0);

  const remainderBase = Math.max(0, (Number(total) || 0) - sumTop);
  const remainder = remainderBase + unknownSum;

  return remainder > 0 ? [...top, { label: otherLabel, value: remainder }] : top;
}

function RankList({ items = [], emptyLabel = "No data", onClickItem }) {
  if (!items?.length)
    return <div style={{ fontWeight: 700, opacity: 0.75 }}>{emptyLabel}</div>;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {items.map((x, i) => (
        <div
          key={`${x.label || x.name || "item"}_${i}`}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 12,
            alignItems: "center",
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid rgba(30,42,120,0.08)",
            background: "rgba(255,255,255,0.72)",
            fontWeight: 720,
            cursor: onClickItem ? "pointer" : "default",
          }}
          onClick={() => onClickItem?.(x)}
          title={onClickItem ? "Click" : undefined}
        >
          <div style={{ fontSize: 14, lineHeight: 1.25 }}>
            {x.label ?? x.name ?? ""}
          </div>
          <div style={{ fontSize: 14, opacity: 0.85 }}>
            {fmtNum(x.value ?? x.count ?? 0)}
          </div>
        </div>
      ))}
    </div>
  );
}

function TableList({ rows = [], emptyLabel = "No data" }) {
  if (!rows?.length)
    return <div style={{ fontWeight: 700, opacity: 0.75 }}>{emptyLabel}</div>;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {rows.map((r, i) => (
        <div
          key={`row_${i}`}
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid rgba(30,42,120,0.08)",
            background: "rgba(255,255,255,0.72)",
            lineHeight: 1.6,
            fontSize: 14,
            fontWeight: 650,
            letterSpacing: "0.1px",
          }}
          dangerouslySetInnerHTML={{ __html: safeHTML(r) }}
        />
      ))}
    </div>
  );
}

// -------------------- component --------------------
export default function LocationInsights() {
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    fetch(base+"/api/insights/locations")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (!alive) return;
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  // -------------------- normalize API -> view model --------------------
  const kpis = useMemo(() => data?.kpis ?? {}, [data]);

  const geo = useMemo(() => data?.geography ?? {}, [data]);
  const geoRegions = useMemo(() => geo?.byRegion ?? {}, [geo]);
  const geoTopCountries = useMemo(() => geo?.topCountries ?? {}, [geo]);
  const geoTopCities = useMemo(() => geo?.topCities ?? {}, [geo]);
  const geoHotspots = useMemo(() => geo?.hotspots ?? [], [geo]);

  const regionsLoc = useMemo(() => pickFirst(geoRegions, ["locations"], []), [geoRegions]);
  const countriesLoc = useMemo(() => pickFirst(geoTopCountries, ["locations"], []), [geoTopCountries]);
  const countriesHQ = useMemo(() => pickFirst(geoTopCountries, ["hqLocations"], []), [geoTopCountries]);
  const citiesLoc = useMemo(() => pickFirst(geoTopCities, ["locations"], []), [geoTopCities]);

  const incentives = useMemo(() => data?.incentives ?? {}, [data]);
  const dq = useMemo(() => data?.dataQuality ?? {}, [data]);
  const headlineCards = useMemo(() => data?.headline ?? [], [data]);
  const footprint = useMemo(() => data?.footprint ?? {}, [data]);
  const maturity = useMemo(() => data?.maturity ?? {}, [data]);

  const population = useMemo(() => data?.population ?? {}, [data]);
  const popCoverage = useMemo(() => population?.coverage ?? {}, [population]);
  const popDensity = useMemo(() => population?.density ?? {}, [population]);
  const popGeo = useMemo(() => population?.geography ?? {}, [population]);

  // -------------------- headline stats --------------------
  const headline = useMemo(() => {
    const totalOrgsInSlice = Number(kpis?.orgsInSlice ?? 0) || 0;
    const totalLocations = Number(kpis?.locations ?? 0) || 0;

    const countryCount = Number(kpis?.distinctCountries ?? 0) || 0;
    const cityCount = Number(kpis?.distinctCities ?? 0) || 0;

    const regionCount =
      new Set((regionsLoc || []).map((x) => x?.label).filter(Boolean)).size ||
      (regionsLoc || []).length;

    const avgLocationsPerOrg = Number(footprint?.locationsPerOrg?.mean ?? 0) || 0;

    const orgsWithLocationsPct = Number(dq?.coverage?.orgsWithNoLocationsPct)
      ? 100 - Number(dq.coverage.orgsWithNoLocationsPct)
      : null;

    return {
      totalOrgs: totalOrgsInSlice,
      totalLocations,
      countryCount,
      cityCount,
      regionCount,
      locationsPerOrgAvg: avgLocationsPerOrg,
      orgsWithLocationsPct,
    };
  }, [kpis, dq, regionsLoc, footprint]);

  // -------------------- visuals (remove Unknown everywhere) --------------------
  const cleanCountriesLoc = useMemo(
    () => (countriesLoc || []).filter((x) => !isUnknownLabel(x?.label)),
    [countriesLoc]
  );
  const cleanCitiesLoc = useMemo(
    () => (citiesLoc || []).filter((x) => !isUnknownLabel(x?.label)),
    [citiesLoc]
  );

  const topCountriesRank = useMemo(
    () => asXY(cleanCountriesLoc, "country", "count").slice(0, 18),
    [cleanCountriesLoc]
  );

  const topCitiesRank = useMemo(
    () => asXY(cleanCitiesLoc, "city", "count").slice(0, 18),
    [cleanCitiesLoc]
  );

  const regionsDonut = useMemo(() => {
    const total = (regionsLoc || []).reduce((s, x) => s + (Number(x?.value ?? 0) || 0), 0);
    return withOtherExclusiveNoUnknown(
      (regionsLoc || []).map((x) => ({
        label: x.label ?? x.region ?? x.name,
        value: Number(x.value ?? 0) || 0,
      })),
      total,
      6,
      "Other regions"
    );
  }, [regionsLoc]);

  const hqCountriesDonut = useMemo(() => {
    const total = (countriesHQ || []).reduce((s, x) => s + (Number(x?.value ?? 0) || 0), 0);
    return withOtherExclusiveNoUnknown(
      (countriesHQ || []).map((x) => ({
        label: x.label ?? x.country ?? x.name,
        value: Number(x.value ?? 0) || 0,
      })),
      total,
      7,
      "Other"
    );
  }, [countriesHQ]);

  const countryConc = useMemo(() => top1Share(hqCountriesDonut), [hqCountriesDonut]);
  const regionConc = useMemo(() => top1Share(regionsDonut), [regionsDonut]);

  // -------------------- incentives --------------------
  const incentivesTopCountries = useMemo(
    () => pickFirst(incentives, ["topCountries"], []),
    [incentives]
  );

  // filter bad labels (unknown + uuid)
  const incentivesTopCountriesClean = useMemo(
    () => (incentivesTopCountries || []).filter((x) => !isBadLabel(x?.country)),
    [incentivesTopCountries]
  );

  const incentiveTypesDonut = useMemo(() => {
    const agg = new Map();
    for (const c of incentivesTopCountriesClean || []) {
      for (const t of c?.topIncentiveTypes || []) {
        const label = String(t?.label ?? t?.type ?? t?.name ?? "").trim();
        const v = Number(t?.value ?? t?.count ?? 0) || 0;
        if (!label || !v || isUnknownLabel(label) || UUID_RE.test(label)) continue;
        agg.set(label, (agg.get(label) || 0) + v);
      }
    }
    const total = Array.from(agg.values()).reduce((a, b) => a + b, 0);
    const list = Array.from(agg.entries()).map(([label, value]) => ({ label, value }));
    list.sort((a, b) => b.value - a.value);
    return withOtherExclusiveNoUnknown(list, total, 6, "Other types");
  }, [incentivesTopCountriesClean]);

  // -------------------- population --------------------
  const popMatchedPct = useMemo(() => Number(popCoverage?.matchedPct ?? 0) || 0, [popCoverage]);

  const popOverIndexed = useMemo(
    () => pickFirst(popDensity, ["overIndexed"], []).filter((x) => !isBadLabel(x?.country)),
    [popDensity]
  );

  const popUnderServed = useMemo(
    () => pickFirst(popDensity, ["underServed"], []).filter((x) => !isBadLabel(x?.country)),
    [popDensity]
  );

  const popDensitySignals = useMemo(() => {
    const notes = [];

    const best = popOverIndexed?.[0];
    if (best?.country && best?.orgsPer1M != null) {
      notes.push(
        `<strong>${best.country}</strong> leads on org density at ~<strong>${Number(best.orgsPer1M).toFixed(
          2
        )}</strong> orgs per 1M people.`
      );
    }

    const big = popUnderServed?.[0];
    if (big?.country && big?.population != null) {
      notes.push(
        `Largest population in footprint: <strong>${big.country}</strong> (~<strong>${fmtNum(
          big.population
        )}</strong>).`
      );
    }

    const d = popGeo?.hqDistanceToTaxCentroidKm;
    if (d?.n) {
      notes.push(
        `HQ centroid spread: median <strong>${fmtNum(d.median)}</strong> km (n=<strong>${fmtNum(d.n)}</strong>).`
      );
    }

    if (!notes.length) notes.push("Population signals will appear once matching is enabled.");
    return notes.slice(0, 6);
  }, [popOverIndexed, popUnderServed, popGeo]);

  // -------------------- notable signals (clean text) --------------------
  const notableSignals = useMemo(() => {
    const notes = [];

    if (Array.isArray(headlineCards) && headlineCards.length) {
      for (const h of headlineCards.slice(0, 10)) {
        const parts = [h?.title, h?.value, h?.detail].filter(Boolean);

        let line = "";
        if (parts.length === 1) line = String(parts[0]);
        if (parts.length === 2) line = `${parts[0]}: ${parts[1]}`;
        if (parts.length >= 3) line = `${parts[0]}: ${parts[1]} — ${parts[2]}`;

        let cleaned = String(line)
          .replace(/population\.csv/gi, "population data")
          .replace(/tax\.csv/gi, "tax data")
          .replace(/locations\.csv/gi, "location data")
          .replace(/orgs\.csv/gi, "org data")
          .replace(/(\d+\.\d{2})\d+/g, "$1")
          .trim();

        if (!cleaned) continue;
        if (UNKNOWN_RE.test(cleaned)) continue;

        // light emphasis: bold the "value" portion if it exists
        if (h?.value) {
          cleaned = cleaned.replace(String(h.value), `<strong>${h.value}</strong>`);
        }

        notes.push(cleaned);
      }
    }

    if (headline.countryCount) {
      notes.push(
        `Coverage spans <strong>${fmtNum(headline.countryCount)}</strong> countries and <strong>${fmtNum(
          headline.cityCount
        )}</strong> cities.`
      );
    }

    const dqMissingCityPct = Number(dq?.missingCity?.anyMissingCityPct ?? 0) || 0;
    // if (dqMissingCityPct > 0) {
    //   notes.push(
    //     `Data quality: <strong>${fmtPct(dqMissingCityPct)}</strong> of location rows are missing a city value.`
    //   );
    // }

    const incentivesMatchedPct = Number(incentives?.coverage?.orgsMatchedPct ?? 0) || 0;
    if (incentivesMatchedPct > 0) {
      notes.push(
        `Incentives: <strong>${fmtPct(incentivesMatchedPct)}</strong> of org HQ countries match at least one program.`
      );
    }

    // if (popMatchedPct > 0) {
    //   notes.push(
    //     `Population coverage: matched <strong>${fmtPct(popMatchedPct)}</strong> of footprint countries to population data.`
    //   );
    // }

    return notes.slice(0, 12);
  }, [headlineCards, headline, dq, incentives, popMatchedPct]);

  // -------------------- navigation helpers --------------------
  function goToOrgsWithCountry(country) {
    const qs = new URLSearchParams();
    qs.set("locationScope", "all");
    qs.set("GEONAME_COUNTRY_NAME", country);
    nav(`/participants/organizations?${qs.toString()}`);
  }

  function goToOrgsWithCity(city) {
    const qs = new URLSearchParams();
    qs.set("locationScope", "all");
    qs.set("CITY", city);
    nav(`/participants/organizations?${qs.toString()}`);
  }

  function goToOrgsWithRegion(region) {
    const qs = new URLSearchParams();
    qs.set("SALES_REGION", region);
    nav(`/participants/organizations?${qs.toString()}`);
  }

  const topCityPills = useMemo(() => {
    const list = (cleanCitiesLoc || [])
      .map((x) => ({
        label: x.label ?? x.city ?? x.name,
        value: Number(x.value ?? x.count ?? 0) || 0,
      }))
      .filter((x) => x.label && !isUnknownLabel(x.label))
      .slice(0, 36);
    return list;
  }, [cleanCitiesLoc]);

  const hotspotsRank = useMemo(() => {
    return (geoHotspots || [])
      .map((x) => ({ label: x.label ?? "", value: Number(x.value ?? 0) || 0 }))
      .filter((x) => x.label && !isUnknownLabel(x.label) && x.value > 0)
      .slice(0, 18);
  }, [geoHotspots]);

  // ✅ Market maturity kept — but we’ll display ONLY org count (and optional median employee count)
  const maturityTop = useMemo(() => {
    return (maturity?.countries || [])
      .filter((x) => !isBadLabel(x?.country))
      .slice(0, 12);
  }, [maturity]);

  // Ensure the Tax + Population cards line up
  const MATCHED_CARDS_MIN_HEIGHT = 760;

  return (
    <InsightsShell
      title="Location Insights"
      subtitle="Footprint, density, incentives, and population-weighted market signals."
      active="locations"
    >
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: -6,
          marginBottom: 12,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => nav("/participants/organizations/production-locations")}
          style={{
            border: "1px solid rgba(30,42,120,0.18)",
            background: "rgba(255,255,255,0.85)",
            borderRadius: 999,
            padding: "10px 14px",
            fontWeight: 900,
            cursor: "pointer",
            boxShadow: "0 10px 24px rgba(17,24,39,0.10)",
          }}
        >
          ← Go to Locations
        </button>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Pill tone="brand">Locations</Pill>
          <Pill tone="neutral">{fmtNum(headline.totalOrgs)} Participant Organizations</Pill>
          {headline.totalLocations ? (
            <Pill tone="neutral">{fmtNum(headline.totalLocations)} Locations Tracked</Pill>
          ) : null}
        </div>
      </div>

      {/* KPIs */}
      <CardGrid min={230}>
        <StatCard
          label="Organizations (slice)"
          value={headline.totalOrgs}
          sublabel="Orgs in current filters"
          icon={<span>{ICONS.orgs}</span>}
          loading={loading}
        />
        <StatCard
          label="Countries"
          value={headline.countryCount}
          sublabel="Distinct countries in slice"
          icon={<span>{ICONS.globe}</span>}
          loading={loading}
        />
        <StatCard
          label="Cities"
          value={headline.cityCount}
          sublabel="Distinct cities in slice"
          icon={<span>{ICONS.city}</span>}
          loading={loading}
        />
        <StatCard
          label="Regions"
          value={headline.regionCount}
          sublabel="Distinct regions in slice"
          icon={<span>{ICONS.map}</span>}
          loading={loading}
        />
        <StatCard
          label="Avg locations / org"
          value={headline.locationsPerOrgAvg || 0}
          sublabel="Global footprint for orgs in slice"
          icon={<span>{ICONS.pin}</span>}
          loading={loading}
        />
        <StatCard
          label="HQ top share (%)"
          value={countryConc.share || 0}
          sublabel={hqCountriesDonut?.[0]?.label || "Concentration"}
          icon={<span>{ICONS.focus}</span>}
          loading={loading}
        />
        <StatCard
          label="Region top share (%)"
          value={regionConc.share || 0}
          sublabel={regionsDonut?.[0]?.label || "Concentration"}
          icon={<span>{ICONS.focus}</span>}
          loading={loading}
        />

      </CardGrid>

      <Divider style={{ margin: "18px 0" }} />

      {/* Notable signals */}
      <Card
        title="Notable signals"
        subtitle="Clean, readable highlights"
        right={<Pill tone="brand">Summary</Pill>}
      >
        {loading ? (
          <div style={{ fontWeight: 700, opacity: 0.75 }}>Loading…</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {notableSignals.map((s, i) => (
              <div
                key={`sig_${i}`}
                style={{
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "1px solid rgba(30,42,120,0.08)",
                  background: "rgba(255,255,255,0.72)",
                  lineHeight: 1.6,
                  fontSize: 14,
                  fontWeight: 650,
                  letterSpacing: "0.1px",
                }}
                dangerouslySetInnerHTML={{ __html: safeHTML(s) }}
              />
            ))}
          </div>
        )}
      </Card>

      <Divider style={{ margin: "18px 0" }} />

      {/* Core geography */}
      <Card
        title="Top countries (locations)"
        subtitle="Most location rows by country"
        right={<Pill>Locations</Pill>}
      >
        <BarChart
          data={topCountriesRank}
          xKey="country"
          yKey="count"
          height={barHeight(topCountriesRank.length, { min: 520, per: 52, max: 980 })}
          orientation="horizontal"
          emptyLabel={loading ? "Loading…" : "No country data"}
        />
      </Card>

      {/* ✅ Donuts stacked vertically */}
      <Card
        title="Regions"
        subtitle="Distribution of location rows by region"
        right={<Pill>Share</Pill>}
      >
        <DonutChart data={regionsDonut} height={520} centerLabel="Locations" />
        {!loading && (regionsLoc || []).length ? (
          <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
            {(regionsLoc || [])
              .filter((r) => !isUnknownLabel(r?.label))
              .slice(0, 8)
              .map((r) => {
                const label = r.label ?? r.region ?? r.name;
                if (!label) return null;
                return (
                  <button
                    key={`regpill_${label}`}
                    onClick={() => goToOrgsWithRegion(label)}
                    style={{
                      border: "1px solid rgba(30,42,120,0.14)",
                      background: "rgba(255,255,255,0.78)",
                      borderRadius: 999,
                      padding: "8px 12px",
                      cursor: "pointer",
                      fontWeight: 800,
                      boxShadow: "0 8px 16px rgba(17,24,39,0.06)",
                    }}
                    title="Open Orgs with Region filter"
                  >
                    {label}
                  </button>
                );
              })}
          </div>
        ) : null}
      </Card>

      <div style={{ height: 14 }} />

      <Card
        title="HQ country share"
        subtitle="Distribution of HQ location rows by country"
        right={<Pill tone="neutral">Share</Pill>}
      >
        <DonutChart data={hqCountriesDonut} height={520} centerLabel="HQs" />
      </Card>

      <Divider style={{ margin: "18px 0" }} />

      {/* Cities */}
      <Card
        title="Top cities (locations)"
        subtitle="Most location rows by city"
        right={<Pill tone="neutral">Locations</Pill>}
      >
        <BarChart
          data={topCitiesRank}
          xKey="city"
          yKey="count"
          height={barHeight(topCitiesRank.length, { min: 520, per: 52, max: 980 })}
          orientation="horizontal"
          emptyLabel={loading ? "Loading…" : "No city data"}
        />
      </Card>

      <Card
        title="City quick filters"
        subtitle="Fast navigation into the Orgs table with a CITY filter"
        right={<Pill tone="neutral">Click to filter</Pill>}
      >
        {loading ? (
          <div style={{ fontWeight: 700, opacity: 0.75 }}>Loading…</div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {topCityPills.map((c) => (
              <button
                key={`city_${c.label}`}
                onClick={() => goToOrgsWithCity(c.label)}
                style={{
                  border: "1px solid rgba(30,42,120,0.16)",
                  background: "rgba(255,255,255,0.78)",
                  borderRadius: 999,
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontWeight: 800,
                  boxShadow: "0 8px 16px rgba(17,24,39,0.06)",
                }}
                title="Open Orgs page with CITY filter"
              >
                {c.label}{" "}
                <span style={{ opacity: 0.7, marginLeft: 6 }}>
                  ({fmtNum(c.value)})
                </span>
              </button>
            ))}
          </div>
        )}
      </Card>

      <Divider style={{ margin: "18px 0" }} />

      {/* Hotspots + Market maturity */}
      <TwoCol
        left={
          <Card
            title="City hotspots"
            subtitle='Top "City • Country" bubbles'
            right={<Pill tone="neutral">Density</Pill>}
          >
            {loading ? (
              <div style={{ fontWeight: 700, opacity: 0.75 }}>Loading…</div>
            ) : (
              <RankList
                items={hotspotsRank}
                emptyLabel="No hotspots data"
                onClickItem={(x) => {
                  const label = x?.label || "";
                  const city = label.split(" • ")[0]?.trim();
                  if (city) goToOrgsWithCity(city);
                }}
              />
            )}
          </Card>
        }
        right={
          <Card
            title="Market maturity (HQ)"
            subtitle="Top HQ markets by org count"
            right={<Pill tone="neutral">Maturity</Pill>}
          >
            {loading ? (
              <div style={{ fontWeight: 700, opacity: 0.75 }}>Loading…</div>
            ) : (
              <TableList
                rows={(maturityTop || []).slice(0, 10).map((r) => {
                  const c = r.country ?? r.label ?? "Country";
                  const orgs = Number(r.orgs ?? 0) || 0;

                  // ✅ no p75/p95/pXX garbage — only median if present
                  const med =
                    r?.employeeCount?.median != null
                      ? fmtNum(r.employeeCount.median)
                      : null;

                  return med
                    ? `<strong>${c}</strong> — <strong>${fmtNum(orgs)}</strong> HQ orgs • median employees <strong>${med}</strong>`
                    : `<strong>${c}</strong> — <strong>${fmtNum(orgs)}</strong> HQ orgs`;
                })}
                emptyLabel="No maturity data"
              />
            )}
          </Card>
        }
      />

      <Divider style={{ margin: "18px 0" }} />

      {/* Tax + Population */}
      <TwoCol
        left={
          <Card
            title="Tax incentives coverage"
            subtitle="Incentive landscape in HQ markets"
            right={<Pill tone="neutral">Tax</Pill>}
          >
            <div style={{ minHeight: MATCHED_CARDS_MIN_HEIGHT }}>
              {loading ? (
                <div style={{ fontWeight: 700, opacity: 0.75 }}>Loading…</div>
              ) : (
                <div style={{ display: "grid", gap: 14 }}>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {Number(incentives?.coverage?.taxRowsLoaded ?? 0) ? (
                      <Pill tone="brand">{fmtNum(incentives.coverage.taxRowsLoaded)} Incentives</Pill>
                    ) : null}
                    {/* {Number(incentives?.coverage?.orgsMatchedPct ?? 0) ? (
                      <Pill tone="brand">{fmtPct(incentives.coverage.orgsMatchedPct)} HQ match</Pill>
                    ) : null} */}
                  </div>

                  <div>
                    <div style={{ fontWeight: 900, marginBottom: 8 }}>
                      Top countries by program count
                    </div>
                    <RankList
                      items={(incentivesTopCountriesClean || []).slice(0, 12).map((x) => ({
                        label: x.country ?? x.label ?? x.name,
                        value: Number(x.programs ?? x.value ?? 0) || 0,
                      }))}
                      emptyLabel="No incentives data"
                      onClickItem={(x) => x?.label && goToOrgsWithCountry(x.label)}
                    />
                  </div>

                  {incentiveTypesDonut?.length ? (
                    <div>
                      <div style={{ fontWeight: 900, marginBottom: 8 }}>
                        Program types (summary)
                      </div>
                      <DonutChart data={incentiveTypesDonut} height={340} centerLabel="Types" />
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </Card>
        }
        right={
          <Card
            title="Population-weighted markets"
            subtitle="Over-indexed vs under-served markets"
            right={<Pill tone="neutral">Population</Pill>}
          >
            <div style={{ minHeight: MATCHED_CARDS_MIN_HEIGHT }}>
              {loading ? (
                <div style={{ fontWeight: 700, opacity: 0.75 }}>Loading…</div>
              ) : (
                <div style={{ display: "grid", gap: 14 }}>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {Number(popCoverage?.popRowsLoaded ?? 0) ? (
                      <Pill tone="brand">{fmtNum(popCoverage.popRowsLoaded)} countries</Pill>
                    ) : null}
                    {/* {Number(popCoverage?.countriesMatched ?? 0) ? (
                      <Pill tone="brand">{fmtNum(popCoverage.countriesMatched)} matched</Pill>
                    ) : null} */}
                  </div>

                  <div>
                    <div style={{ fontWeight: 900, marginBottom: 8 }}>
                      Most over-indexed (orgs / 1M)
                    </div>
                    <RankList
                      items={(popOverIndexed || []).slice(0, 12).map((r) => ({
                        label: r.country ?? "Country",
                        value: Number(r.orgsPer1M ?? 0) || 0,
                      }))}
                      emptyLabel="No over-indexed data"
                      onClickItem={(x) => x?.label && goToOrgsWithCountry(x.label)}
                    />
                  </div>

                  <div>
                    <div style={{ fontWeight: 900, marginBottom: 8 }}>
                      Under-served (largest population)
                    </div>
                    <RankList
                      items={(popUnderServed || []).slice(0, 12).map((r) => ({
                        label: r.country ?? "Country",
                        value: Number(r.population ?? 0) || 0,
                      }))}
                      emptyLabel="No under-served data"
                      onClickItem={(x) => x?.label && goToOrgsWithCountry(x.label)}
                    />
                  </div>

                  <div>
                    <div style={{ fontWeight: 900, marginBottom: 8 }}>Signals</div>
                    <TableList rows={popDensitySignals} emptyLabel="No population signals" />
                  </div>
                </div>
              )}
            </div>
          </Card>
        }
      />

      <Divider style={{ margin: "18px 0" }} />

      {/* Cohort table hook */}
      <Card
        title="Organizations (location-driven view)"
        subtitle="Use the filters above to drill into geographies."
        right={<Pill tone="neutral">Search + paginate</Pill>}
      >
        <PaginatedOrgTable
          baseFilters={{}}
          title="Organizations"
          subtitle="Use the filters above to drill into geographies."
        />
      </Card>
    </InsightsShell>
  );
}
