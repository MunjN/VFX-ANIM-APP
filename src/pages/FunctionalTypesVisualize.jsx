// src/pages/FunctionalTypesVisualize.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const BRAND = {
  ink: "#1E2A78",
  fill: "#CFEFF7",
  bg: "#F7FBFE",
  text: "#111827",
  border: "#1E2A78",
};

const PALETTE = [
  "#1E2A78",
  "#2563EB",
  "#0EA5E9",
  "#14B8A6",
  "#22C55E",
  "#F59E0B",
  "#F97316",
  "#EF4444",
  "#A855F7",
  "#64748B",
];

function pickColor(i) {
  return PALETTE[i % PALETTE.length];
}

function Pill({ children, onClick, active = false, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: 999,
        border: `1px solid rgba(30,42,120,${active ? 0.38 : 0.22})`,
        background: active ? "rgba(207,239,247,0.90)" : "rgba(207,239,247,0.55)",
        color: BRAND.ink,
        fontWeight: 1000,
        fontSize: 12,
        whiteSpace: "nowrap",
        cursor: onClick ? "pointer" : "default",
        boxShadow: active ? "0 10px 26px rgba(30,42,120,0.12)" : "none",
      }}
    >
      {children}
    </button>
  );
}

function Card({ title, subtitle, right, children, style }) {
  return (
    <div
      style={{
        borderRadius: 18,
        border: `1px solid rgba(30,42,120,0.16)`,
        background: "#FFFFFF",
        boxShadow: "0 22px 80px rgba(30,42,120,0.08)",
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid rgba(30,42,120,0.12)",
          background:
            "linear-gradient(180deg, rgba(207,239,247,0.55), rgba(255,255,255,0.85))",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 1000,
              color: BRAND.ink,
              letterSpacing: 0.35,
            }}
          >
            {subtitle || "INSIGHTS"}
          </div>
          <div style={{ fontSize: 18, fontWeight: 1000, color: BRAND.text }}>
            {title}
          </div>
        </div>
        {right}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

// clean, non-choppy list row
function ToggleRow({
  name,
  count,
  pct,
  active,
  onClick,
  isFirst = false,
  isLast = false,
}) {
  const r = 14;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        display: "grid",
        gridTemplateColumns: "4px 1fr auto",
        gap: 12,
        alignItems: "center",
        padding: "14px 14px",
        minHeight: 64,
        border: "none",
        borderBottom: isLast ? "none" : "1px solid rgba(30,42,120,0.10)",
        background: active ? "rgba(207,239,247,0.45)" : "#FFFFFF",
        cursor: "pointer",
        minWidth: 0,
        borderTopLeftRadius: isFirst ? r : 0,
        borderTopRightRadius: isFirst ? r : 0,
        borderBottomLeftRadius: isLast ? r : 0,
        borderBottomRightRadius: isLast ? r : 0,
      }}
      title={name}
    >
      <div
        style={{
          width: 4,
          height: "100%",
          borderRadius: 999,
          background: active ? "rgba(30,42,120,0.75)" : "transparent",
        }}
      />
      <div
        style={{
          fontWeight: 1000,
          color: "#0B0F1A",
          whiteSpace: "normal",
          overflowWrap: "anywhere",
          lineHeight: 1.25,
          padding: "2px 0",
          minWidth: 0,
        }}
      >
        {name}
        {typeof pct === "number" ? (
          <span style={{ marginLeft: 10, fontWeight: 900, color: "rgba(17,24,39,0.55)" }}>
            {pct.toFixed(1)}%
          </span>
        ) : null}
      </div>
      <div
        style={{
          fontWeight: 1000,
          color: "rgba(30,42,120,0.9)",
          whiteSpace: "nowrap",
          alignSelf: "start",
          paddingTop: 2,
        }}
      >
        {Number(count || 0).toLocaleString()}
      </div>
    </button>
  );
}

function buildQS({ l1, l2, size, salesRegion, country, q }) {
  const params = new URLSearchParams();
  if (l1?.length) params.set("l1", l1.join(","));
  if (l2?.length) params.set("l2", l2.join(","));
  if (size?.length) params.set("size", size.join(","));
  if (salesRegion?.length) params.set("salesRegion", salesRegion.join(","));
  if (country?.length) params.set("country", country.join(","));
  if (q?.trim()) params.set("q", q.trim());
  const s = params.toString();
  return s ? `?${s}` : "";
}

function toggleInArray(arr, value) {
  const set = new Set(arr);
  if (set.has(value)) set.delete(value);
  else set.add(value);
  return [...set];
}

function compactList(str, max = 2) {
  const toks = String(str || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (toks.length <= max) return toks.join(", ");
  return `${toks.slice(0, max).join(", ")} +${toks.length - max}`;
}

// MultiDonut (with hover tooltip)
function MultiDonut({
  title,
  rows = [],
  total = 0,
  onPick,
  activeSet = new Set(),
  maxSegments = 6,
  layout = "vertical",
}) {
  const [tip, setTip] = useState(null);
  const r = 44;
  const c = 2 * Math.PI * r;

  const segments = useMemo(() => {
    const clean = (rows || [])
      .filter((x) => x && x.name && typeof x.count === "number")
      .sort((a, b) => b.count - a.count);

    const top = clean.slice(0, maxSegments);
    const restCount = clean.slice(maxSegments).reduce((s, x) => s + (x.count || 0), 0);

    const out = [...top];
    if (restCount > 0) {
      out.push({
        name: "Others",
        count: restCount,
        pct: total ? (restCount / total) * 100 : 0,
        __others: true,
      });
    }
    return out;
  }, [rows, maxSegments, total]);

  const arcs = useMemo(() => {
    let offset = 0;
    return segments.map((s, i) => {
      const pct = total ? (s.count / total) * 100 : 0;
      const dash = (pct / 100) * c;
      const arc = { ...s, pct, color: pickColor(i), dash, offset };
      offset += dash;
      return arc;
    });
  }, [segments, total, c]);

  const top = arcs[0];
  const tipText = (a) => `${a.name} • ${a.count.toLocaleString()} • ${a.pct.toFixed(1)}%`;

  const donut = (
    <div style={{ display: "grid", justifyItems: "center", minWidth: 0 }}>
      <div style={{ position: "relative", width: 120, height: 120 }}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(30,42,120,0.10)" strokeWidth="12" />
          {arcs.map((a) => (
            <circle
              key={`arc:${title}:${a.name}`}
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke={a.color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${a.dash} ${c - a.dash}`}
              strokeDashoffset={-a.offset}
              transform="rotate(-90 60 60)"
              style={{ cursor: a.name === "Others" ? "default" : "pointer" }}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
                setTip({ x: rect.left + 60, y: rect.top + 8, text: tipText(a) });
              }}
              onMouseMove={(e) => {
                setTip((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY - 18 } : prev));
              }}
              onMouseLeave={() => setTip(null)}
              onClick={() => {
                if (a.name === "Others") return;
                onPick?.(a);
              }}
            />
          ))}
          <circle cx="60" cy="60" r="34" fill="#FFFFFF" />
          <text x="60" y="56" textAnchor="middle" fontSize="18" fontWeight="1000" fill="#0B0F1A">
            {top ? `${Math.round(top.pct)}%` : "0%"}
          </text>
          <text
            x="60"
            y="74"
            textAnchor="middle"
            fontSize="11"
            fontWeight="900"
            fill="rgba(30,42,120,0.85)"
          >
            {top ? "Top" : "—"}
          </text>
        </svg>

        {tip ? (
          <div
            style={{
              position: "fixed",
              left: tip.x,
              top: tip.y,
              transform: "translate(-50%, -100%)",
              zIndex: 9999,
              pointerEvents: "none",
              background: "rgba(17,24,39,0.95)",
              color: "#FFFFFF",
              fontSize: 12,
              fontWeight: 900,
              padding: "8px 10px",
              borderRadius: 12,
              boxShadow: "0 18px 50px rgba(0,0,0,0.18)",
              whiteSpace: "nowrap",
            }}
          >
            {tip.text}
          </div>
        ) : null}
      </div>

      <div
        style={{
          marginTop: 6,
          fontSize: 12,
          fontWeight: 900,
          color: "rgba(17,24,39,0.85)",
          textAlign: "center",
          maxWidth: 180,
          minWidth: 0,
        }}
        title={top?.name || ""}
      >
        {top?.name || "No data"}
      </div>
    </div>
  );

  const legend = (
    <div style={{ display: "grid", gap: 10, minWidth: 0 }}>
      {arcs.map((a, i) => {
        const active = activeSet.has(a.name);

        return (
          <button
            key={`legend:${title}:${a.name}`}
            type="button"
            onClick={() => {
              if (a.name === "Others") return;
              onPick?.(a);
            }}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setTip({
                x: rect.left + rect.width / 2,
                y: rect.top,
                text: tipText(a),
              });
            }}
            onMouseMove={(e) => {
              setTip((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY - 18 } : prev));
            }}
            onMouseLeave={() => setTip(null)}
            style={{
              width: "100%",
              textAlign: "left",
              display: "grid",
              gridTemplateColumns: "16px minmax(0, 1fr) auto auto",
              gap: 10,
              alignItems: "start",
              padding: "10px 12px",
              borderRadius: 14,
              border: `1px solid rgba(30,42,120,${active ? 0.30 : 0.12})`,
              background: active ? "rgba(207,239,247,0.70)" : "rgba(247,251,254,0.55)",
              cursor: a.name === "Others" ? "default" : "pointer",
              minWidth: 0,
            }}
            title={tipText(a)}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: a.color,
                boxShadow: "0 0 0 3px rgba(255,255,255,0.9)",
                marginTop: 3,
              }}
            />

            <div
              style={{
                fontWeight: 1000,
                color: "#0B0F1A",
                minWidth: 0,
                whiteSpace: "normal",
                lineHeight: 1.15,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
              title={a.name}
            >
              {a.name}
            </div>

            <div style={{ fontWeight: 1000, color: "rgba(30,42,120,0.9)", whiteSpace: "nowrap" }}>
              {a.count.toLocaleString()}
            </div>

            <div style={{ fontWeight: 1000, color: "rgba(17,24,39,0.72)", whiteSpace: "nowrap" }}>
              {total ? `${((a.count / total) * 100).toFixed(1)}%` : ""}
            </div>
          </button>
        );
      })}
    </div>
  );

  if (layout === "stack") {
    return (
      <div style={{ display: "grid", gap: 12, minWidth: 0 }}>
        {donut}
        {legend}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "160px minmax(0, 1fr)",
        gap: 14,
        alignItems: "start",
        minWidth: 0,
      }}
    >
      {donut}
      {legend}
    </div>
  );
}

// Tree (bar vibe, fixed node size, static connector thickness)
function SankeyTree({
  total = 0,
  level1 = [],
  level2 = [],
  links = [],
  selectedL1 = [],
  selectedL2 = [],
  onToggleL1,
  onToggleL2,
}) {
  const focusedL1 = selectedL1.length ? selectedL1[0] : level1[0]?.name || "";
  const l2List = useMemo(
    () =>
      focusedL1 ? level2.filter((x) => x.l1 === focusedL1).sort((a, b) => b.count - a.count) : [],
    [level2, focusedL1]
  );

  const W = 1400;
  const H = 640;

  const pad = 18;
  const nodeW = 380;
  const nodeH = 72;
  const gap = 12;
  const maxStackH = 520;

  function wrapWords(text, maxCharsPerLine = 30, maxLines = 2) {
    const words = String(text || "").split(/\s+/).filter(Boolean);
    const lines = [];
    let cur = "";
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (next.length <= maxCharsPerLine) cur = next;
      else {
        if (cur) lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
    if (lines.length <= maxLines) return lines;
    const trimmed = lines.slice(0, maxLines);
    trimmed[maxLines - 1] += "…";
    return trimmed;
  }

  function nameLines(name, w) {
    const usable = Math.max(140, w - 56);
    const approxChars = Math.floor(usable / 7.2);
    return wrapWords(name, Math.max(18, approxChars), 2);
  }

  function stackLayout(items, x, y) {
    const full = items.length * nodeH + gap * Math.max(0, items.length - 1);
    const startY = y + Math.max(0, (maxStackH - full) / 2);

    let cy = startY;
    return items.map((it) => {
      const out = { key: it.name, name: it.name, count: it.count, x, y: cy, w: nodeW, h: nodeH };
      cy += nodeH + gap;
      return out;
    });
  }

  const root = { name: "Total Organizations", count: total, x: pad, y: pad + 250, w: 320, h: 96 };
  const col1X = 410;
  const col2X = 860;

  const l1Nodes = stackLayout(level1, col1X, pad + 50);
  const l2Nodes = stackLayout(l2List, col2X, pad + 50);

  const l1Map = new Map(l1Nodes.map((n) => [n.name, n]));
  const linkBy = useMemo(() => {
    const m = new Map();
    for (const lk of links || []) m.set(`${lk.source}|||${lk.target}`, lk.count || 0);
    return m;
  }, [links]);

  const rootToL1 = useMemo(
    () =>
      l1Nodes
        .map((n) => ({
          source: root,
          target: n,
          count: linkBy.get(`Total Organizations|||${n.name}`) || n.count || 0,
        }))
        .filter((x) => x.count > 0),
    [l1Nodes, linkBy]
  );

  const l1ToL2 = useMemo(() => {
    if (!focusedL1) return [];
    const src = l1Map.get(focusedL1);
    if (!src) return [];
    return l2Nodes
      .map((n) => ({
        source: src,
        target: n,
        count: linkBy.get(`${focusedL1}|||${n.name}`) || n.count || 0,
      }))
      .filter((x) => x.count > 0);
  }, [focusedL1, l2Nodes, linkBy, l1Map]);

  function linkPath(a, b) {
    const x0 = a.x + a.w;
    const y0 = a.y + a.h / 2;
    const x1 = b.x;
    const y1 = b.y + b.h / 2;
    const mx = (x0 + x1) / 2;
    return `M ${x0} ${y0} C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`;
  }

  const strokeFor = () => 2.5;

  const activeL1Set = new Set(selectedL1);
  const activeL2Set = new Set(selectedL2);

  const BAR = {
    fill: "rgba(14,165,233,0.35)",
    fillActive: "rgba(14,165,233,0.60)",
    stroke: "rgba(30,42,120,0.18)",
    strokeFocused: "rgba(30,42,120,0.55)",
    link: "rgba(30,42,120,0.20)",
  };

  return (
    <div
      style={{
        borderRadius: 18,
        border: "1px solid rgba(30,42,120,0.12)",
        background: "rgba(247,251,254,0.55)",
        padding: 12,
        overflow: "auto",
      }}
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {rootToL1.map((lk, i) => (
          <path
            key={`r-l1:${i}`}
            d={linkPath(lk.source, lk.target)}
            fill="none"
            stroke={BAR.link}
            strokeWidth={strokeFor()}
            strokeLinecap="round"
          />
        ))}

        {l1ToL2.map((lk, i) => (
          <path
            key={`l1-l2:${i}`}
            d={linkPath(lk.source, lk.target)}
            fill="none"
            stroke={BAR.link}
            strokeWidth={strokeFor()}
            strokeLinecap="round"
          />
        ))}

        <g style={{ cursor: "pointer" }} onClick={() => onToggleL1?.("__CLEAR_ALL__")}>
          <rect
            x={root.x}
            y={root.y}
            rx="14"
            ry="14"
            width={root.w}
            height={root.h}
            fill="#FFFFFF"
            stroke="rgba(30,42,120,0.22)"
          />
          <rect x={root.x} y={root.y} width={root.w} height="10" rx="14" ry="14" fill={BAR.fillActive} />
          <text x={root.x + 14} y={root.y + 38} fontSize="15" fontWeight="1000" fill="#0B0F1A">
            {root.name}
          </text>
          <text x={root.x + 14} y={root.y + 66} fontSize="13" fontWeight="1000" fill="rgba(30,42,120,0.92)">
            {root.count.toLocaleString()} orgs
          </text>
        </g>

        {l1Nodes.map((n) => {
          const active = activeL1Set.has(n.name);
          const focused = n.name === focusedL1;
          const lines = nameLines(n.name, n.w);

          return (
            <g key={`l1node:${n.name}`} style={{ cursor: "pointer" }} onClick={() => onToggleL1?.(n.name)}>
              <rect
                x={n.x}
                y={n.y}
                rx="12"
                ry="12"
                width={n.w}
                height={n.h}
                fill="#FFFFFF"
                stroke={focused ? BAR.strokeFocused : active ? "rgba(30,42,120,0.32)" : BAR.stroke}
              />
              <rect
                x={n.x}
                y={n.y}
                width={n.w}
                height="10"
                rx="12"
                ry="12"
                fill={active || focused ? BAR.fillActive : BAR.fill}
              />
              <text x={n.x + 12} y={n.y + 30} fontSize="13" fontWeight="1000" fill="#0B0F1A">
                {lines.map((line, idx) => (
                  <tspan key={idx} x={n.x + 12} dy={idx === 0 ? 0 : 16}>
                    {line}
                  </tspan>
                ))}
              </text>
              <text
                x={n.x + n.w - 12}
                y={n.y + 30}
                textAnchor="end"
                fontSize="13"
                fontWeight="1000"
                fill="rgba(30,42,120,0.92)"
              >
                {n.count.toLocaleString()}
              </text>
            </g>
          );
        })}

        {l2Nodes.map((n) => {
          const active = activeL2Set.has(n.name);
          const lines = nameLines(n.name, n.w);

          return (
            <g key={`l2node:${n.name}`} style={{ cursor: "pointer" }} onClick={() => onToggleL2?.(n.name)}>
              <rect
                x={n.x}
                y={n.y}
                rx="12"
                ry="12"
                width={n.w}
                height={n.h}
                fill="#FFFFFF"
                stroke={active ? "rgba(30,42,120,0.32)" : BAR.stroke}
              />
              <rect
                x={n.x}
                y={n.y}
                width={n.w}
                height="10"
                rx="12"
                ry="12"
                fill={active ? BAR.fillActive : BAR.fill}
              />
              <text x={n.x + 12} y={n.y + 30} fontSize="13" fontWeight="1000" fill="#0B0F1A">
                {lines.map((line, idx) => (
                  <tspan key={idx} x={n.x + 12} dy={idx === 0 ? 0 : 16}>
                    {line}
                  </tspan>
                ))}
              </text>
              <text
                x={n.x + n.w - 12}
                y={n.y + 30}
                textAnchor="end"
                fontSize="13"
                fontWeight="1000"
                fill="rgba(30,42,120,0.92)"
              >
                {n.count.toLocaleString()}
              </text>
            </g>
          );
        })}

        <text x={root.x} y={24} fontSize="12" fontWeight="1000" fill="rgba(30,42,120,0.9)">
          ROOT
        </text>
        <text x={col1X} y={24} fontSize="12" fontWeight="1000" fill="rgba(30,42,120,0.9)">
          LEVEL 1 (Umbrella)
        </text>
        <text x={col2X} y={24} fontSize="12" fontWeight="1000" fill="rgba(30,42,120,0.9)">
          LEVEL 2 (Subtype) — focused by L1
        </text>
      </svg>
    </div>
  );
}

export default function FunctionalTypesVisualize() {
  const navigate = useNavigate();

  const [selL1, setSelL1] = useState([]);
  const [selL2, setSelL2] = useState([]);
  const [selSize, setSelSize] = useState([]);
  const [selSalesRegion, setSelSalesRegion] = useState([]);
  const [selCountry, setSelCountry] = useState([]);
  const [search, setSearch] = useState("");
  const [countryFacetQ, setCountryFacetQ] = useState("");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [searchDebounced, setSearchDebounced] = useState("");
  const tRef = useRef(null);
  useEffect(() => {
    if (tRef.current) clearTimeout(tRef.current);
    tRef.current = setTimeout(() => setSearchDebounced(search), 250);
    return () => {
      if (tRef.current) clearTimeout(tRef.current);
    };
  }, [search]);

  const qs = useMemo(
    () =>
      buildQS({
        l1: selL1,
        l2: selL2,
        size: selSize,
        salesRegion: selSalesRegion,
        country: selCountry,
        q: searchDebounced,
      }),
    [selL1, selL2, selSize, selSalesRegion, selCountry, searchDebounced]
  );

  useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();

    async function run() {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(`/api/functional-types/insights${qs}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        if (!alive) return;
        setData(j);
      } catch (e) {
        if (!alive) return;
        if (e?.name === "AbortError") return;
        setErr(e?.message || "Failed to load insights.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [qs]);

  const totals = useMemo(
    () => ({
      all: data?.totalOrgsAll ?? 0,
      filtered: data?.totalOrgsFiltered ?? 0,
    }),
    [data]
  );

  const sizeRows = data?.size?.rows || [];
  const salesRegionRows = data?.salesRegion?.rows || [];
  const countryRows = data?.country?.rows || [];
  const orgRows = data?.orgs || [];

  const treeLevel1 = data?.tree?.level1 || [];
  const treeLevel2 = data?.tree?.level2 || [];
  const treeLinks = data?.tree?.links || [];

  const activeFiltersCount =
    selL1.length +
    selL2.length +
    selSize.length +
    selSalesRegion.length +
    selCountry.length +
    (searchDebounced?.trim() ? 1 : 0);

  const clearAll = () => {
    setSelL1([]);
    setSelL2([]);
    setSelSize([]);
    setSelSalesRegion([]);
    setSelCountry([]);
    setSearch("");
    setCountryFacetQ("");
  };

  // ✅ Org-page URL params use display labels, not DB keys
  const goToOrgsPage = (extra = {}) => {
    const params = new URLSearchParams();

    const nextL1 = extra.l1 ?? selL1;
    const nextL2 = extra.l2 ?? selL2;
    const nextSize = extra.size ?? selSize;
    const nextSR = extra.salesRegion ?? selSalesRegion;
    const nextCountry = extra.country ?? selCountry;

    const clean = (arr) =>
      Array.from(new Set((arr || []).map((x) => String(x || "").trim()).filter(Boolean)));

    // Functional types: flatten L1 + L2 into org-page field
    const functionalTypes = clean([...(nextL1 || []), ...(nextL2 || [])]);
    const sizes = clean(nextSize);
    const salesRegions = clean(nextSR);
    const countries = clean(nextCountry);

    if (functionalTypes.length) params.set("ORGANIZATION_FUNCTIONAL_TYPE", functionalTypes.join(","));
    if (sizes.length) params.set("ORG_SIZING_CALCULATED", sizes.join(","));
    if (salesRegions.length) params.set("SALES_REGION", salesRegions.join(","));
    if (countries.length) params.set("GEONAME_COUNTRY_NAME", countries.join(","));
    if (searchDebounced?.trim()) params.set("q", searchDebounced.trim());

    params.set("page", "1");

    const s = params.toString();
    navigate(`/participants/organizations${s ? `?${s}` : ""}`);
  };

  const goToOrgDetails = (orgId) => {
    if (!orgId) return;
    navigate(`/participants/organizations/${orgId}`);
  };

  const filteredCountryRows = useMemo(() => {
    const needle = countryFacetQ.trim().toLowerCase();
    if (!needle) return countryRows;
    return countryRows.filter((r) => String(r.name || "").toLowerCase().includes(needle));
  }, [countryRows, countryFacetQ]);

  const activeSize = new Set(selSize);
  const activeSR = new Set(selSalesRegion);

  const countryListRows = (filteredCountryRows.length ? filteredCountryRows : countryRows).slice(0, 160);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BRAND.bg,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        color: BRAND.text,
      }}
    >
      {/* Header */}
      <div style={{ padding: "22px 26px 14px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => navigate("/")}
              style={{
                border: "none",
                background: BRAND.fill,
                color: BRAND.ink,
                fontWeight: 1000,
                padding: "10px 14px",
                borderRadius: 14,
                cursor: "pointer",
                letterSpacing: 0.2,
                boxShadow: "0 8px 28px rgba(30,42,120,0.12)",
              }}
            >
              ME-NEXUS
            </button>

            <span style={{ padding: "0 10px", opacity: 0.6 }}>›</span>

            <button
              type="button"
              onClick={() => navigate("/participants")}
              style={{
                border: "none",
                background: "transparent",
                color: BRAND.ink,
                fontWeight: 1000,
                cursor: "pointer",
                padding: "8px 10px",
                borderRadius: 10,
              }}
            >
              Participants
            </button>

            <span style={{ padding: "0 10px", opacity: 0.6 }}>›</span>

            <button
              type="button"
              onClick={() => navigate("/participants/organizations")}
              style={{
                border: "none",
                background: "transparent",
                color: BRAND.ink,
                fontWeight: 1000,
                cursor: "pointer",
                padding: "8px 10px",
                borderRadius: 10,
              }}
            >
              Organizations
            </button>

            <span style={{ padding: "0 10px", opacity: 0.6 }}>›</span>

            <button
              type="button"
              onClick={() => navigate("/participants/organizations/functional-types")}
              style={{
                border: "none",
                background: "transparent",
                color: BRAND.ink,
                fontWeight: 1000,
                cursor: "pointer",
                padding: "8px 10px",
                borderRadius: 10,
              }}
            >
              Functional Types
            </button>

            <span style={{ padding: "0 10px", opacity: 0.6 }}>›</span>

            <span style={{ fontWeight: 1000, opacity: 0.95 }}>Visualize</span>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginLeft: 10 }}>
              <Pill title="Total orgs in dataset">{totals.all} orgs</Pill>
              <Pill active title="Orgs matching current filters">
                {totals.filtered} selected
              </Pill>
              {activeFiltersCount ? (
                <Pill title="Clear all filters" onClick={clearAll} active>
                  Clear Filters ✕
                </Pill>
              ) : (
                <Pill title="No active filters">All Filters</Pill>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => goToOrgsPage()}
              style={{
                border: `1px solid rgba(30,42,120,0.18)`,
                background: "#FFFFFF",
                color: BRAND.ink,
                fontWeight: 1000,
                padding: "10px 12px",
                borderRadius: 12,
                cursor: "pointer",
              }}
              title="Open Organizations page with current selections"
            >
              View Orgs →
            </button>

            <button
              type="button"
              onClick={() => navigate("/participants/organizations/functional-types")}
              style={{
                border: `1px solid rgba(30,42,120,0.18)`,
                background: "#FFFFFF",
                color: BRAND.ink,
                fontWeight: 1000,
                padding: "10px 12px",
                borderRadius: 12,
                cursor: "pointer",
              }}
              title="Back to functional types reference"
            >
              ← Back
            </button>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 34, fontWeight: 1000, letterSpacing: -0.4, color: "#0B0F1A" }}>
            Functional Types — Visualize
          </div>

          <div
            style={{
              marginTop: 10,
              borderRadius: 18,
              border: `1px solid rgba(30,42,120,0.16)`,
              background: "#FFFFFF",
              boxShadow: "0 18px 60px rgba(30,42,120,0.08)",
              padding: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search selected orgs (name, id, functional type, size, sales region, country)…"
                style={{
                  width: "min(720px, 92vw)",
                  border: `1px solid rgba(30,42,120,0.22)`,
                  background: "#FFFFFF",
                  borderRadius: 14,
                  padding: "10px 12px",
                  fontWeight: 900,
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={() => setSearch("")}
                disabled={!search}
                style={{
                  border: `1px solid rgba(30,42,120,0.22)`,
                  background: search ? BRAND.fill : "rgba(243,244,246,0.7)",
                  color: search ? BRAND.ink : "rgba(30,42,120,0.45)",
                  fontWeight: 1000,
                  padding: "10px 12px",
                  borderRadius: 14,
                  cursor: search ? "pointer" : "not-allowed",
                }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading / Error */}
      <div style={{ padding: "0 26px 18px" }}>
        {loading ? (
          <div
            style={{
              borderRadius: 18,
              border: `1px solid rgba(30,42,120,0.16)`,
              background: "#FFFFFF",
              boxShadow: "0 18px 60px rgba(30,42,120,0.08)",
              padding: 16,
              fontWeight: 1000,
              color: BRAND.ink,
            }}
          >
            Loading Visuals...
          </div>
        ) : err ? (
          <div
            style={{
              borderRadius: 18,
              border: `1px solid rgba(30,42,120,0.16)`,
              background: "rgba(254,242,242,0.65)",
              boxShadow: "0 18px 60px rgba(30,42,120,0.08)",
              padding: 16,
              fontWeight: 1000,
              color: "#7F1D1D",
            }}
          >
            Failed to load: {err}
          </div>
        ) : null}
      </div>

      {/* TREE */}
      <div style={{ padding: "0 26px 16px" }}>
        <Card
          title="Functional Type Paths"
          subtitle="TREE"
          right={
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Pill title="Root count (selected set)" active>
                {totals.filtered} orgs
              </Pill>
              <button
                type="button"
                onClick={() => {
                  setSelL1([]);
                  setSelL2([]);
                }}
                style={{
                  border: `1px solid rgba(30,42,120,0.18)`,
                  background: "#FFFFFF",
                  color: BRAND.ink,
                  fontWeight: 1000,
                  padding: "8px 10px",
                  borderRadius: 12,
                  cursor: "pointer",
                }}
                title="Clear functional type selections"
              >
                Clear Type
              </button>
            </div>
          }
        >
          <SankeyTree
            total={totals.filtered}
            level1={treeLevel1}
            level2={treeLevel2}
            links={treeLinks}
            selectedL1={selL1}
            selectedL2={selL2}
            onToggleL1={(name) => {
              if (name === "__CLEAR_ALL__") {
                setSelL1([]);
                setSelL2([]);
                return;
              }
              setSelL1((prev) => toggleInArray(prev, name));
            }}
            onToggleL2={(name) => setSelL2((prev) => toggleInArray(prev, name))}
          />
          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => goToOrgsPage()}
              style={{
                border: `1px solid rgba(30,42,120,0.18)`,
                background: "#FFFFFF",
                color: BRAND.ink,
                fontWeight: 1000,
                padding: "10px 12px",
                borderRadius: 12,
                cursor: "pointer",
              }}
              title="Go to main orgs page with current selections"
            >
              View orgs →
            </button>
          </div>
        </Card>
      </div>

      {/* LOWER GRID (3 columns: Country Browser | Size+Region | Country Mix expanded) */}
      <div
        style={{
          padding: "0 26px 26px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 16,
          alignItems: "start",
        }}
      >
        {/* LEFT: Country Browser */}
        <Card
          title="Countries"
          subtitle="BROWSE"
          right={
            <button
              type="button"
              onClick={() => setSelCountry([])}
              style={{
                border: `1px solid rgba(30,42,120,0.18)`,
                background: "#FFFFFF",
                color: BRAND.ink,
                fontWeight: 1000,
                padding: "8px 10px",
                borderRadius: 12,
                cursor: "pointer",
              }}
              title="Clear country selections"
            >
              Clear Country
            </button>
          }
        >
          <input
            value={countryFacetQ}
            onChange={(e) => setCountryFacetQ(e.target.value)}
            placeholder="Search countries…"
            style={{
              width: "100%",
              border: `1px solid rgba(30,42,120,0.22)`,
              background: "#FFFFFF",
              borderRadius: 14,
              padding: "10px 12px",
              fontWeight: 900,
              outline: "none",
              minWidth: 0,
            }}
          />

          <div style={{ marginTop: 10 }}>
            <div
              style={{
                borderRadius: 16,
                border: "1px solid rgba(30,42,120,0.12)",
                overflow: "hidden",
                minWidth: 0,
                background: "#FFFFFF",
              }}
            >
              <div style={{ overflow: "auto", maxHeight: 740 }}>
                {countryListRows.map((r, idx) => (
                  <ToggleRow
                    key={`ctry:${r.name}`}
                    name={r.name}
                    count={r.count}
                    pct={r.pct}
                    active={selCountry.includes(r.name)}
                    onClick={() => setSelCountry((prev) => toggleInArray(prev, r.name))}
                    isFirst={idx === 0}
                    isLast={idx === countryListRows.length - 1}
                  />
                ))}
              </div>
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => goToOrgsPage()}
                style={{
                  border: `1px solid rgba(30,42,120,0.18)`,
                  background: "#FFFFFF",
                  color: BRAND.ink,
                  fontWeight: 1000,
                  padding: "10px 12px",
                  borderRadius: 12,
                  cursor: "pointer",
                }}
                title="View orgs in main table"
              >
                View orgs →
              </button>
            </div>
          </div>
        </Card>

        {/* MIDDLE: Size + Sales Region */}
        <div style={{ display: "grid", gap: 16, minWidth: 0 }}>
          <Card
            title="Organizations by Size"
            subtitle="COMPOSITION"
            right={
              <button
                type="button"
                onClick={() => setSelSize([])}
                style={{
                  border: `1px solid rgba(30,42,120,0.18)`,
                  background: "#FFFFFF",
                  color: BRAND.ink,
                  fontWeight: 1000,
                  padding: "8px 10px",
                  borderRadius: 12,
                  cursor: "pointer",
                }}
              >
                Clear Size
              </button>
            }
          >
            <MultiDonut
              title="size"
              rows={sizeRows}
              total={totals.filtered}
              activeSet={activeSize}
              onPick={(seg) => {
                if (seg?.name === "Others") return;
                setSelSize((prev) => toggleInArray(prev, seg.name));
              }}
              maxSegments={8}
              layout="vertical"
            />
          </Card>

          <Card
            title="Organizations by Sales Region"
            subtitle="COMPOSITION"
            right={
              <button
                type="button"
                onClick={() => setSelSalesRegion([])}
                style={{
                  border: `1px solid rgba(30,42,120,0.18)`,
                  background: "#FFFFFF",
                  color: BRAND.ink,
                  fontWeight: 1000,
                  padding: "8px 10px",
                  borderRadius: 12,
                  cursor: "pointer",
                }}
              >
                Clear Region
              </button>
            }
          >
            <MultiDonut
              title="salesRegion"
              rows={salesRegionRows}
              total={totals.filtered}
              activeSet={activeSR}
              onPick={(seg) => {
                if (seg?.name === "Others") return;
                setSelSalesRegion((prev) => toggleInArray(prev, seg.name));
              }}
              maxSegments={8}
              layout="vertical"
            />
          </Card>
        </div>

        {/* RIGHT: give ALL space to COUNTRY MIX */}
        <Card title="Organizations by Country" subtitle="COMPOSITION">
          <div
            style={{
              borderRadius: 10,
              border: "1px solid rgba(30,42,120,0.12)",
              background: "rgba(247,251,254,0.55)",
              padding: 10,
              minWidth: 0,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 1000, color: BRAND.ink, letterSpacing: 0.35 }}>
              COUNTRY MIX (Top + Others)
            </div>

            <div style={{ marginTop: 10, minWidth: 0 }}>
              <MultiDonut
                title="country"
                rows={countryRows}
                total={totals.filtered}
                activeSet={new Set(selCountry)}
                onPick={(seg) => {
                  if (!seg?.name || seg.name === "Others") return;
                  setSelCountry((prev) => toggleInArray(prev, seg.name));
                }}
                maxSegments={8}
                layout="stack"
              />
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => goToOrgsPage()}
                style={{
                  border: `1px solid rgba(30,42,120,0.18)`,
                  background: "#FFFFFF",
                  color: BRAND.ink,
                  fontWeight: 1000,
                  padding: "10px 10px",
                  borderRadius: 10,
                  cursor: "pointer",
                }}
                title="View orgs in main table"
              >
                View orgs →
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Orgs Table */}
      <div style={{ padding: "0 26px 26px" }}>
        <Card
          title="Organizations (Selected)"
          subtitle="TABLE"
          right={
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <Pill title="Selected org rows" active>
                Rows: {orgRows.length}
              </Pill>
              <button
                type="button"
                onClick={() => goToOrgsPage()}
                style={{
                  border: `1px solid rgba(30,42,120,0.18)`,
                  background: "#FFFFFF",
                  color: BRAND.ink,
                  fontWeight: 1000,
                  padding: "8px 10px",
                  borderRadius: 12,
                  cursor: "pointer",
                }}
                title="Open Organizations page with current selections"
              >
                Open in Orgs →
              </button>
            </div>
          }
        >
          <div style={{ borderRadius: 16, border: "1px solid rgba(30,42,120,0.12)", overflow: "hidden" }}>
            <div style={{ overflow: "auto", maxHeight: "calc(100vh - 420px)" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                <thead>
                  <tr>
                    {["Org ID", "Name", "Functional Type", "Size", "Sales Region", "Country"].map((h) => (
                      <th
                        key={h}
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 1,
                          textAlign: "left",
                          padding: "12px 14px",
                          fontSize: 12,
                          letterSpacing: 0.35,
                          fontWeight: 1000,
                          color: BRAND.ink,
                          background: "#FFFFFF",
                          borderBottom: "1px solid rgba(30,42,120,0.14)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {orgRows.map((r, idx) => (
                    <tr
                      key={`${r.orgId}:${idx}`}
                      style={{
                        background: idx % 2 === 0 ? "rgba(247,251,254,0.75)" : "#FFFFFF",
                      }}
                    >
                      <td
                        style={{
                          padding: "12px 14px",
                          borderBottom: "1px solid rgba(30,42,120,0.08)",
                          fontWeight: 1000,
                          color: "#0B0F1A",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {r.orgId || <span style={{ opacity: 0.55 }}>—</span>}
                      </td>

                      <td
                        style={{
                          padding: "12px 14px",
                          borderBottom: "1px solid rgba(30,42,120,0.08)",
                          fontWeight: 1000,
                          minWidth: 260,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => goToOrgDetails(r.orgId)}
                          style={{
                            border: "none",
                            background: "transparent",
                            padding: 0,
                            margin: 0,
                            cursor: "pointer",
                            color: BRAND.ink,
                            fontWeight: 1000,
                            textDecoration: "underline",
                            textUnderlineOffset: 3,
                          }}
                          title="Open org details"
                        >
                          {r.name || "—"}
                        </button>
                      </td>

                      <td
                        style={{
                          padding: "12px 14px",
                          borderBottom: "1px solid rgba(30,42,120,0.08)",
                          fontWeight: 900,
                          color: "rgba(17,24,39,0.92)",
                          minWidth: 340,
                        }}
                      >
                        {r.functionalType || <span style={{ opacity: 0.55 }}>—</span>}
                      </td>

                      <td
                        style={{
                          padding: "12px 14px",
                          borderBottom: "1px solid rgba(30,42,120,0.08)",
                          fontWeight: 900,
                          color: "rgba(17,24,39,0.92)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {r.size || <span style={{ opacity: 0.55 }}>—</span>}
                      </td>

                      <td
                        style={{
                          padding: "12px 14px",
                          borderBottom: "1px solid rgba(30,42,120,0.08)",
                          fontWeight: 900,
                          color: "rgba(17,24,39,0.92)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {r.salesRegion || <span style={{ opacity: 0.55 }}>—</span>}
                      </td>

                      <td
                        style={{
                          padding: "12px 14px",
                          borderBottom: "1px solid rgba(30,42,120,0.08)",
                          fontWeight: 900,
                          color: "rgba(17,24,39,0.92)",
                          minWidth: 240,
                        }}
                        title={r.country || ""}
                      >
                        {r.country ? compactList(r.country, 2) : <span style={{ opacity: 0.55 }}>—</span>}
                      </td>
                    </tr>
                  ))}

                  {!loading && orgRows.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: 18 }}>
                        <div
                          style={{
                            border: `1px dashed rgba(30,42,120,0.25)`,
                            borderRadius: 16,
                            padding: 16,
                            background: "rgba(207,239,247,0.25)",
                            color: BRAND.ink,
                            fontWeight: 1000,
                          }}
                        >
                          No organizations match the current selection. Try clearing filters.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
