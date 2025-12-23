import { useNavigate } from "react-router-dom";

const BRAND = {
  ink: "#1E2A78",
  fill: "#CFEFF7",
  bg: "#FFFFFF",
  text: "#111827",
};

function Shape({ kind, children }) {
  const common = { stroke: BRAND.ink, strokeWidth: 8, fill: BRAND.fill };

  if (kind === "hex") {
    return (
      <svg width="240" height="180" viewBox="0 0 240 180" role="img">
        <polygon points="70,14 170,14 222,90 170,166 70,166 18,90" {...common} />
        {/* consistent icon center */}
        <g transform="translate(0,0)">{children}</g>
      </svg>
    );
  }

  if (kind === "wedge") {
    return (
      <svg width="240" height="180" viewBox="0 0 240 180" role="img">
        <path d="M22 34 H176 Q218 40 218 90 Q218 140 176 146 H22 Z" {...common} />
        <g>{children}</g>
      </svg>
    );
  }

  if (kind === "pill") {
    return (
      <svg width="240" height="180" viewBox="0 0 240 180" role="img">
        <rect x="22" y="34" width="196" height="112" rx="56" ry="56" {...common} />
        <g>{children}</g>
      </svg>
    );
  }

  return (
    <svg width="240" height="180" viewBox="0 0 240 180" role="img">
      <circle cx="120" cy="90" r="76" {...common} />
      <g>{children}</g>
    </svg>
  );
}

/** Participants icon (already good) */
function OrgsIcon() {
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

/** Tasks icon (nudged + slightly scaled to sit centered in wedge) */
function DrawingPersonIcon() {
  return (
    <g transform="translate(0,0)">
      <g
        transform="translate(44,26) scale(0.98)"
        stroke={BRAND.ink}
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="0" y="18" width="136" height="96" rx="10" />
        <line x1="0" y1="44" x2="136" y2="44" />
        <circle cx="44" cy="76" r="14" />
        <path d="M24 114 Q44 92 64 114" />
        <path d="M62 98 Q78 88 92 96" />
        <path d="M92 96 L110 84" />
        <rect x="86" y="54" width="40" height="22" rx="6" />
        <path d="M92 64 H118" />
        <circle cx="110" cy="30" r="4" fill={BRAND.ink} />
        <circle cx="124" cy="30" r="4" fill={BRAND.ink} />
      </g>
    </g>
  );
}

function WindowIcon() {
  return (
    <g transform="translate(0,0)">
      <g transform="translate(52,45) scale(0.98)" stroke={BRAND.ink} strokeWidth="7" fill="none" strokeLinejoin="round">
        <rect x="0" y="0" width="136" height="92" rx="12" />
        <circle cx="108" cy="18" r="4" fill={BRAND.ink} />
        <circle cx="122" cy="18" r="4" fill={BRAND.ink} />
        <line x1="0" y1="32" x2="136" y2="32" />
      </g>
    </g>
  );
}

/** Creative works icon (nudged left a hair + down, so masks sit centered in circle) */
function MasksIcon() {
  return (
    <g transform="translate(0,0)">
      <g
        transform="translate(55,28) scale(0.95)"
        stroke={BRAND.ink}
        strokeWidth="8"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <path
          d="M16 18 Q56 10 70 36 Q84 64 64 92 Q50 112 40 120 Q30 110 18 92 Q0 64 16 18 Z"
          fill={BRAND.fill}
        />
        <path
          d="M78 30 Q112 20 126 48 Q140 78 120 106 Q106 126 96 134 Q86 124 76 106 Q58 78 78 30 Z"
          fill={BRAND.fill}
        />
        <path d="M32 56 Q38 50 44 56" />
        <path d="M52 56 Q58 50 64 56" />
        <path d="M40 78 Q50 86 60 78" />
        <path d="M92 70 Q98 64 104 70" />
        <path d="M112 70 Q118 64 124 70" />
        <path d="M94 96 Q110 88 126 96" />
      </g>
    </g>
  );
}

function Tile({ title, description, shape, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: "none",
        background: "transparent",
        padding: 0,
        cursor: "pointer",
        textAlign: "left",
      }}
      aria-label={title}
    >
      <div style={{ display: "grid", justifyItems: "center", gap: 14 }}>
        <div style={{ width: 240, height: 180, display: "grid", placeItems: "center" }}>
          <Shape kind={shape}>{icon}</Shape>
        </div>

        <div style={{ width: 300 }}>
          <div
            style={{
              fontFamily: "system-ui",
              fontWeight: 900,
              color: BRAND.ink,
              fontSize: 30,
              textAlign: "center",
              marginBottom: 10,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontFamily: "system-ui",
              color: BRAND.text,
              fontSize: 16,
              lineHeight: 1.55,
              textAlign: "center",
              padding: "0 10px",
            }}
          >
            {description}
          </div>
        </div>
      </div>
    </button>
  );
}

function MiniShape({ kind }) {
  const common = { stroke: BRAND.ink, strokeWidth: 8, fill: BRAND.fill };
  if (kind === "hex") {
    return (
      <svg width="84" height="64" viewBox="0 0 240 180" aria-hidden="true">
        <polygon points="70,14 170,14 222,90 170,166 70,166 18,90" {...common} />
      </svg>
    );
  }
  if (kind === "wedge") {
    return (
      <svg width="84" height="64" viewBox="0 0 240 180" aria-hidden="true">
        <path d="M22 34 H176 Q218 40 218 90 Q218 140 176 146 H22 Z" {...common} />
      </svg>
    );
  }
  if (kind === "pill") {
    return (
      <svg width="84" height="64" viewBox="0 0 240 180" aria-hidden="true">
        <rect x="22" y="34" width="196" height="112" rx="56" ry="56" {...common} />
      </svg>
    );
  }
  return (
    <svg width="84" height="64" viewBox="0 0 240 180" aria-hidden="true">
      <circle cx="120" cy="90" r="76" {...common} />
    </svg>
  );
}

export default function HomeRelationships() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: BRAND.bg }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "36px 24px 24px" }}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <a
            href="https://me-dmz.com"
            target="_blank"
            rel="noreferrer"
            style={{
              fontFamily: "system-ui",
              fontWeight: 1000,
              color: BRAND.ink,
              fontSize: 34,
              letterSpacing: 1,
              textDecoration: "none",
            }}
          >
            ME-DMZ
          </a>
        </div>

        <h1
          style={{
            fontFamily: "system-ui",
            fontWeight: 1000,
            color: BRAND.ink,
            fontSize: 64,
            textAlign: "center",
            margin: "12px 0 44px",
            letterSpacing: -1.2,
          }}
        >
          Our Data Is About Relationships
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 28,
            alignItems: "start",
            justifyItems: "center",
          }}
        >
          <Tile
            title="Participants"
            description="The entities that make up the M&E ecosystem, including organizations and people"
            shape="hex"
            icon={<OrgsIcon />}
            onClick={() => navigate("/participants")}
          />
          <Tile
            title="Tasks"
            description="The steps and methods to be completed in the production process of a Creative Works"
            shape="wedge"
            icon={<DrawingPersonIcon />}
            onClick={() => navigate("/participants/organizations/services")}
          />
          <Tile
            title="Infrastructure"
            description="The underlying systems, tools and framework required to produce Creative Works"
            shape="pill"
            icon={<WindowIcon />}
            onClick={() => navigate("/infrastructure")}
          />
          <Tile
            title="Creative works"
            description="The content created by M&E participants using infrastructure and completion of tasks"
            shape="circle"
            icon={<MasksIcon />}
            onClick={() => navigate("/creative-works")}
          />
        </div>

        <div style={{ marginTop: 54, display: "flex", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
            <div style={{ display: "grid", justifyItems: "center" }}>
              <MiniShape kind="hex" />
              <div style={{ width: 110, borderBottom: `3px solid ${BRAND.text}`, marginTop: 6 }} />
            </div>

            <div style={{ fontFamily: "system-ui", fontSize: 44, fontWeight: 1000, color: "#000" }}>perform</div>

            <div style={{ display: "grid", justifyItems: "center" }}>
              <MiniShape kind="wedge" />
              <div style={{ width: 110, borderBottom: `3px solid ${BRAND.text}`, marginTop: 6 }} />
            </div>

            <div style={{ fontFamily: "system-ui", fontSize: 44, fontWeight: 1000, color: "#000" }}>using</div>

            <div style={{ display: "grid", justifyItems: "center" }}>
              <MiniShape kind="pill" />
              <div style={{ width: 110, borderBottom: `3px solid ${BRAND.text}`, marginTop: 6 }} />
            </div>

            <div style={{ fontFamily: "system-ui", fontSize: 44, fontWeight: 1000, color: "#000" }}>on</div>

            <div style={{ display: "grid", justifyItems: "center" }}>
              <MiniShape kind="circle" />
              <div style={{ width: 110, borderBottom: `3px solid ${BRAND.text}`, marginTop: 6 }} />
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 1100px) {
            div[style*="grid-template-columns: repeat(4"] { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          }
          @media (max-width: 640px) {
            div[style*="grid-template-columns: repeat(2"] { grid-template-columns: 1fr !important; }
            h1 { font-size: 44px !important; }
          }
        `}</style>
      </div>
    </div>
  );
}

