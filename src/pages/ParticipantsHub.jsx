import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

const BRAND = {
  ink: "#1E2A78",
  fill: "#CFEFF7",
  bg: "#F7FBFE",
  text: "#111827",
  border: "#1E2A78",
};

const ORG_DEFS = {
  functionalTypes:
    "Functional Types: This is the list of functions an organization plays during the production process such as producing content, providing infrastructure, distributing content etc.",
  contentTypes:
    "Content Types: This is the type of Content (i.e. scripted content, gaming) that an organization is related to by its functional type (i.e. service provider, distributor).",
  productionLocations:
    "Production Locations: This is the list of countries or regions where an organization is located. Organizations can have multiple locations.",
  services:
    "Services: This is the list of services offered by the organization in the media creation process.",
  infra:
    "Infra: This is the list of tools, technology, and frameworks that the organization owns, or provides services in, and/or has tagged itself as using them in their work.",
  organizations:
    "Organizations: An officially registered entity that plays an integral part in the production of Entertainment Media.",
};

/** ---------------------------
 *  Top Bar (ME-NEXUS -> home)
 *  --------------------------*/
function TopBar({ topBarRef }) {
  const navigate = useNavigate();

  return (
    <div
      ref={topBarRef}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "22px 26px",
        background: "transparent",
        flex: "0 0 auto",
      }}
    >
      <div style={{ fontFamily: "system-ui", fontWeight: 900, fontSize: 26, color: "#0B0F1A" }}>
        <button
          type="button"
          onClick={() => navigate("/")}
          style={{
            border: "none",
            background: "transparent",
            padding: 0,
            margin: 0,
            cursor: "pointer",
            fontFamily: "system-ui",
            fontWeight: 1000,
            fontSize: 26,
            color: "#0B0F1A",
          }}
        >
          ME-NEXUS
        </button>

        <span style={{ padding: "0 12px", opacity: 0.6 }}>›</span>
        <span style={{ fontWeight: 700, opacity: 0.9 }}>Participants</span>
      </div>

      <a
        href="https://me-dmz.com"
        target="_blank"
        rel="noreferrer"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontFamily: "system-ui",
          fontWeight: 1000,
          color: BRAND.ink,
          fontSize: 30,
          textDecoration: "none",
          letterSpacing: 0.8,
        }}
      >
        ME-DMZ
      </a>
    </div>
  );
}

/** ---------------------------
 *  Hex geometry + connectors
 *  --------------------------*/
const HEX_VIEW = { w: 240, h: 210 };
const HEX_POLY = [
  { x: 70, y: 18 },
  { x: 170, y: 18 },
  { x: 222, y: 105 },
  { x: 170, y: 192 },
  { x: 70, y: 192 },
  { x: 18, y: 105 },
];

function rayToHexEdge(cx, cy, tx, ty) {
  const dx = tx - cx;
  const dy = ty - cy;
  let best = null;

  for (let i = 0; i < HEX_POLY.length; i++) {
    const a = HEX_POLY[i];
    const b = HEX_POLY[(i + 1) % HEX_POLY.length];
    const sx = b.x - a.x;
    const sy = b.y - a.y;

    const det = dx * (-sy) - dy * (-sx);
    if (Math.abs(det) < 1e-9) continue;

    const rx = a.x - cx;
    const ry = a.y - cy;

    const t = (rx * (-sy) - ry * (-sx)) / det;
    const u = (dx * ry - dy * rx) / det;

    if (t > 0 && u >= 0 && u <= 1) {
      if (!best || t < best.t) best = { t, x: cx + t * dx, y: cy + t * dy };
    }
  }

  return best ? { x: best.x, y: best.y } : { x: cx, y: cy };
}

function HexNode({
  left,
  top,
  label,
  children,
  labelOffsetY = 10,
  boxW = 260,
  boxH = 220,
  onClick,
  tooltip,
}) {
  const clickable = typeof onClick === "function";
  const [hover, setHover] = useState(false);

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: boxW,
        height: boxH + 46,
        display: "grid",
        justifyItems: "center",
        zIndex: 3,
      }}
      title={tooltip || undefined}
    >
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          border: "none",
          background: "transparent",
          padding: 0,
          margin: 0,
          cursor: clickable ? "pointer" : "default",
          width: boxW,
          height: boxH,
          display: "block",
          transform: clickable && hover ? "translateY(-2px)" : "translateY(0px)",
          transition: "transform 140ms ease",
        }}
        aria-label={clickable ? `${label} (open)` : label}
        disabled={!clickable}
      >
        <svg width={boxW} height={boxH} viewBox={`0 0 ${HEX_VIEW.w} ${HEX_VIEW.h}`} aria-hidden="true">
          <polygon
            points="70,18 170,18 222,105 170,192 70,192 18,105"
            fill={BRAND.fill}
            stroke={BRAND.border}
            strokeWidth="8"
          />
          <g>{children}</g>
        </svg>
      </button>

      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          marginTop: labelOffsetY,
          border: "none",
          cursor: clickable ? "pointer" : "default",
          background: BRAND.bg,
          padding: "2px 10px",
          borderRadius: 10,
          fontFamily: "system-ui",
          fontWeight: 900,
          fontSize: 24,
          color: BRAND.ink,
          lineHeight: 1.1,
          opacity: clickable ? 1 : 0.95,
          transform: clickable && hover ? "translateY(-1px)" : "translateY(0px)",
          transition: "transform 140ms ease",
        }}
        disabled={!clickable}
        aria-label={clickable ? `${label} (open)` : label}
      >
        {label}
      </button>
    </div>
  );
}

/** Icons (centered tweaks applied) */
function ParticipantsHexIcon() {
  // group icon (no colors)
  return (
    <g transform="translate(66,44)" stroke={BRAND.ink} strokeWidth="8" fill="none" strokeLinecap="round">
      <circle cx="54" cy="26" r="16" />
      <circle cx="24" cy="44" r="12" />
      <circle cx="84" cy="44" r="12" />
      <path d="M16 90 Q54 60 92 90" />
      <path d="M2 102 Q24 82 46 102" />
      <path d="M62 102 Q84 82 106 102" />
    </g>
  );
}

function OrganizationsHexIcon() {
  // colored collars icon
  return (
    <g
      transform="translate(50,25)"
      stroke={BRAND.ink}
      strokeWidth="7"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="70" cy="38" r="16" />
      <circle cx="42" cy="74" r="16" />
      <circle cx="98" cy="74" r="16" />

      <path d="M58 54 Q70 62 82 54" stroke="#15803D" strokeWidth="10" />
      <path d="M30 90 Q42 98 54 90" stroke="#B45309" strokeWidth="10" />
      <path d="M86 90 Q98 98 110 90" stroke="#CA8A04" strokeWidth="10" />

      <path d="M52 130 Q70 112 88 130" />
      <path d="M20 138 Q42 120 64 138" />
      <path d="M76 138 Q98 120 120 138" />
    </g>
  );
}

function PeopleHexIcon() {
  return (
    <g
      transform="translate(30,-15)"
      stroke={BRAND.ink}
      strokeWidth="7"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="30" y="78" width="120" height="82" rx="10" />
      <rect x="48" y="96" width="32" height="32" rx="6" stroke="#15803D" />
      <circle cx="64" cy="112" r="8" />
      <path d="M56 124 Q64 118 72 124" />
      <path d="M92 102 H138" stroke="#6B7280" />
      <path d="M92 122 H138" stroke="#6B7280" />
      <path d="M92 142 H130" stroke="#6B7280" />
    </g>
  );
}

function Connectors({ nodes }) {
  const getCenter = (n) => ({ cx: n.x + n.w * 0.5, cy: n.y + n.h * 0.5 });

  const toView = (n, px, py) => ({
    vx: ((px - n.x) / n.w) * HEX_VIEW.w,
    vy: ((py - n.y) / n.h) * HEX_VIEW.h,
  });

  const toCanvas = (n, vx, vy) => ({
    px: n.x + (vx / HEX_VIEW.w) * n.w,
    py: n.y + (vy / HEX_VIEW.h) * n.h,
  });

  const line = (fromId, toId) => {
    const a = nodes.find((n) => n.id === fromId);
    const b = nodes.find((n) => n.id === toId);
    if (!a || !b) return null;

    const ac = getCenter(a);
    const bc = getCenter(b);

    const aViewC = toView(a, ac.cx, ac.cy);
    const aViewT = toView(a, bc.cx, bc.cy);
    const aEdgeV = rayToHexEdge(aViewC.vx, aViewC.vy, aViewT.vx, aViewT.vy);
    const aEdge = toCanvas(a, aEdgeV.x, aEdgeV.y);

    const bViewC = toView(b, bc.cx, bc.cy);
    const bViewT = toView(b, ac.cx, ac.cy);
    const bEdgeV2 = rayToHexEdge(bViewC.vx, bViewC.vy, bViewT.vx, bViewT.vy);
    const bEdge = toCanvas(b, bEdgeV2.x, bEdgeV2.y);

    return { x1: aEdge.px, y1: aEdge.py, x2: bEdge.px, y2: bEdge.py };
  };

  const l1 = line("participants", "organizations");
  const l2 = line("participants", "people");

  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}
      aria-hidden="true"
    >
      {l1 ? <line x1={l1.x1} y1={l1.y1} x2={l1.x2} y2={l1.y2} stroke={BRAND.border} strokeWidth="6" /> : null}
      {l2 ? <line x1={l2.x1} y1={l2.y1} x2={l2.x2} y2={l2.y2} stroke={BRAND.border} strokeWidth="6" /> : null}
    </svg>
  );
}

/** Buttons */
function CardButton({ label, tooltip, onClick, disabled = false, disabledTooltip }) {
  const [open, setOpen] = useState(false);
  const tipText = disabled ? disabledTooltip ?? "" : tooltip;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <button
        onClick={disabled ? undefined : onClick}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        style={{
          width: "100%",
          height: 96,
          borderRadius: 12,
          border: `6px solid ${BRAND.border}`,
          background: BRAND.fill,
          color: BRAND.ink,
          fontFamily: "system-ui",
          fontWeight: 900,
          fontSize: 26,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.55 : 1,
          outline: "none",
          padding: "0 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          whiteSpace: "normal",
          lineHeight: 1.1,
          boxSizing: "border-box",
        }}
        aria-disabled={disabled}
      >
        {label}
      </button>

      {open && tipText ? (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: -14,
            transform: "translate(-50%, -100%)",
            width: 380,
            maxWidth: "min(380px, calc(100vw - 32px))",
            background: "#FFFFFF",
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: 8,
            padding: "10px 12px",
            fontFamily: "system-ui",
            fontSize: 14,
            lineHeight: 1.35,
            color: "#111827",
            boxShadow: "0 10px 26px rgba(0,0,0,0.12)",
            zIndex: 20,
          }}
        >
          {tipText}
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: -8,
              width: 14,
              height: 14,
              transform: "translateX(-50%) rotate(45deg)",
              background: "#FFFFFF",
              borderRight: "1px solid rgba(0,0,0,0.12)",
              borderBottom: "1px solid rgba(0,0,0,0.12)",
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

/** Page */
export default function ParticipantsHub() {
  const navigate = useNavigate();
  const comingSoon = useMemo(() => "Coming in Q1 2026", []);

  const topBarRef = useRef(null);

  const CANVAS_W = 1687;
  const CANVAS_H = 820;

  const HEX_W = 260;
  const HEX_H = 220;

  const NODES = [
    { id: "participants", x: 70, y: 330, w: HEX_W, h: HEX_H },
    { id: "organizations", x: 350, y: 150, w: HEX_W, h: HEX_H },
    { id: "people", x: 350, y: 520, w: HEX_W, h: HEX_H },
  ];

  // Scale to fit BOTH width and height (prevents vertical scroll + cutoffs)
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const recalc = () => {
      const sidePadding = 26 * 2;
      const verticalPadding = 30;

      const topBarH = topBarRef.current?.getBoundingClientRect?.().height ?? 0;

      const availW = Math.max(320, window.innerWidth - sidePadding);
      const availH = Math.max(320, window.innerHeight - topBarH - verticalPadding - 2);

      const s = Math.min(1, availW / CANVAS_W, availH / CANVAS_H);
      setScale(s);
    };

    recalc();
    window.addEventListener("resize", recalc);

    const ro = new ResizeObserver(recalc);
    if (topBarRef.current) ro.observe(topBarRef.current);

    return () => {
      window.removeEventListener("resize", recalc);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      style={{
        height: "100vh",
        background: BRAND.bg,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <TopBar topBarRef={topBarRef} />

      <div style={{ flex: "1 1 auto", display: "flex", justifyContent: "center" }}>
        <div
          style={{
            width: "100%",
            maxWidth: CANVAS_W,
            padding: "0 26px 30px",
            boxSizing: "border-box",
            height: Math.floor(CANVAS_H * scale) + 30,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: CANVAS_W,
              height: CANVAS_H,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              position: "relative",
            }}
          >
            {/* LEFT GRAPH */}
            <div style={{ position: "absolute", left: 0, top: 0, width: 720, height: CANVAS_H }}>
              <Connectors nodes={NODES} />

              <HexNode
                left={NODES[1].x}
                top={NODES[1].y}
                label="Organizations"
                onClick={() => navigate("/participants/organizations")}
                tooltip={ORG_DEFS.organizations}
              >
                <OrganizationsHexIcon />
              </HexNode>

              <HexNode left={NODES[0].x} top={NODES[0].y} label="Participants">
                <ParticipantsHexIcon />
              </HexNode>

              <div style={{ position: "absolute", left: NODES[2].x + 92, top: NODES[2].y - 40, zIndex: 4 }}>
                <div
                  style={{
                    fontFamily: "system-ui",
                    fontWeight: 900,
                    fontSize: 24,
                    color: BRAND.ink,
                    background: BRAND.bg,
                    padding: "2px 10px",
                    borderRadius: 10,
                    lineHeight: 1.1,
                  }}
                >
                  People
                </div>
              </div>

              <HexNode left={NODES[2].x} top={NODES[2].y} label=" ">
                <PeopleHexIcon />
              </HexNode>
            </div>

            {/* RIGHT BUTTONS */}
            <div style={{ position: "absolute", left: 720, top: 110, width: 940 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "340px 340px 340px",
                  gridTemplateRows: "104px 104px",
                  columnGap: 18,
                  rowGap: 22,
                  gridTemplateAreas: `
                    "ft ct pl"
                    "sv inf pl"
                  `,
                  alignItems: "center",
                }}
              >
                <div style={{ gridArea: "ft" }}>
                  <CardButton
                    label="Functional Types"
                    tooltip={ORG_DEFS.functionalTypes}
                    onClick={() => navigate("/participants/organizations/functional-types")}
                  />
                </div>

                <div style={{ gridArea: "ct" }}>
                  <CardButton
                    label="Content Types"
                    tooltip={ORG_DEFS.contentTypes}
                    onClick={() => navigate("/participants/organizations/content-types")}
                  />
                </div>

                <div style={{ gridArea: "pl", alignSelf: "center" }}>
                  <CardButton
                    label="Production Locations"
                    tooltip={ORG_DEFS.productionLocations}
                    onClick={() => navigate("/participants/organizations/production-locations")}
                  />
                </div>

                <div style={{ gridArea: "sv" }}>
                  <CardButton
                    label="Services"
                    tooltip={ORG_DEFS.services}
                    onClick={() => navigate("/participants/organizations/services")}
                  />
                </div>

                <div style={{ gridArea: "inf" }}>
                  <CardButton
                    label="Infrastructure"
                    tooltip={ORG_DEFS.infra}
                    onClick={() => navigate("/participants/organizations/infrastructure")}
                  />
                </div>
              </div>

              <div style={{ marginTop: 170 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "340px 340px 340px",
                    gridTemplateRows: "104px 104px",
                    columnGap: 18,
                    rowGap: 22,
                    alignItems: "center",
                  }}
                >
                  <CardButton label="Roles" disabled tooltip="" disabledTooltip={comingSoon} />
                  <CardButton label="Seniority" disabled tooltip="" disabledTooltip={comingSoon} />
                  <CardButton label="Experience" disabled tooltip="" disabledTooltip={comingSoon} />
                  <CardButton label="Skills" disabled tooltip="" disabledTooltip={comingSoon} />
                  <CardButton label="Education" disabled tooltip="" disabledTooltip={comingSoon} />
                  <CardButton label="Licenses & Certifications" disabled tooltip="" disabledTooltip={comingSoon} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
