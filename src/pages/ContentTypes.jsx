import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const BRAND = {
  ink: "#1E2A78",
  fill: "#CFEFF7",
  bg: "#F7FBFE",
  text: "#111827",
  border: "#1E2A78",
};
const base = import.meta.env.VITE_API_BASE;

const PAGE = {
  max: 1280,
};

const CONTENT_TYPE_DEFINITION =
"This is the type of Content (i.e. scripted content, gaming) that an organization is related to by its functional type (i.e. service provider, distributor)"
/**
 * Source-of-truth reference data provided by you.
 * We ignore Proposed New Name (not present here).
 */
const CONTENT_TYPES_REFERENCE = [
  {
    CONTENT_TYPE_ID: "eda78c92-a64c-4660-bb2a-f408699a1615",
    CONTENT_TYPE_NAME: "Scripted",
    CONTENT_TYPE_L1_ID: "eda78c92-a64c-4660-bb2a-f408699a1615",
    CONTENT_TYPE_L1_NAME: "Scripted",
    CONTENT_TYPE_L2_ID: "",
    CONTENT_TYPE_L2_NAME: "",
    Description:
      "Narrative creative works based on a written script featuring professional actors and structured storytelling.",
  },
  {
    CONTENT_TYPE_ID: "bb196b5e-2099-4b53-98b6-8ae9032dc30b",
    CONTENT_TYPE_NAME: "Episodic",
    CONTENT_TYPE_L1_ID: "eda78c92-a64c-4660-bb2a-f408699a1615",
    CONTENT_TYPE_L1_NAME: "Scripted",
    CONTENT_TYPE_L2_ID: "bb196b5e-2099-4b53-98b6-8ae9032dc30b",
    CONTENT_TYPE_L2_NAME: "Episodic",
    Description:
      "Serialized scripted creative works released in segments or installments under a shared narrative arc.",
  },
  {
    CONTENT_TYPE_ID: "c114725e-4fd4-4fae-a7bb-6574cd3cb69b",
    CONTENT_TYPE_NAME: "Short Form",
    CONTENT_TYPE_L1_ID: "eda78c92-a64c-4660-bb2a-f408699a1615",
    CONTENT_TYPE_L1_NAME: "Scripted",
    CONTENT_TYPE_L2_ID: "c114725e-4fd4-4fae-a7bb-6574cd3cb69b",
    CONTENT_TYPE_L2_NAME: "Short Form",
    Description: "Scripted creative works under 40 minutes",
  },
  {
    CONTENT_TYPE_ID: "e7a539fe-1574-4f1b-b1e9-928f4e4c31b2",
    CONTENT_TYPE_NAME: "Feature",
    CONTENT_TYPE_L1_ID: "eda78c92-a64c-4660-bb2a-f408699a1615",
    CONTENT_TYPE_L1_NAME: "Scripted",
    CONTENT_TYPE_L2_ID: "e7a539fe-1574-4f1b-b1e9-928f4e4c31b2",
    CONTENT_TYPE_L2_NAME: "Feature",
    Description:
      "Long-form scripted creative works intended for theatrical or premium digital release.",
  },
  {
    CONTENT_TYPE_ID: "fcdfc914-4d9b-4f3a-9627-72fe2397c0a0",
    CONTENT_TYPE_NAME: "Video Game",
    CONTENT_TYPE_L1_ID: "fcdfc914-4d9b-4f3a-9627-72fe2397c0a0",
    CONTENT_TYPE_L1_NAME: "Video Game",
    CONTENT_TYPE_L2_ID: "",
    CONTENT_TYPE_L2_NAME: "",
    Description:
      "Interactive experiences built on real-time engines and designed for player engagement across multiple platforms.",
  },
  {
    CONTENT_TYPE_ID: "fa63acaa-2031-4e04-b411-fcdb2d272006",
    CONTENT_TYPE_NAME: "Web",
    CONTENT_TYPE_L1_ID: "fcdfc914-4d9b-4f3a-9627-72fe2397c0a0",
    CONTENT_TYPE_L1_NAME: "Video Game",
    CONTENT_TYPE_L2_ID: "fa63acaa-2031-4e04-b411-fcdb2d272006",
    CONTENT_TYPE_L2_NAME: "Web",
    Description:
      "Games or interactive media delivered through browser-based or online environments.",
  },
  {
    CONTENT_TYPE_ID: "cf30177c-306c-4403-8609-7057b0857971",
    CONTENT_TYPE_NAME: "Cloud",
    CONTENT_TYPE_L1_ID: "fcdfc914-4d9b-4f3a-9627-72fe2397c0a0",
    CONTENT_TYPE_L1_NAME: "Video Game",
    CONTENT_TYPE_L2_ID: "cf30177c-306c-4403-8609-7057b0857971",
    CONTENT_TYPE_L2_NAME: "Cloud",
    Description:
      "Games or interactive experiences executed via remote computing infrastructure, enabling streaming without local installation.",
  },
  {
    CONTENT_TYPE_ID: "b931f70e-c4fd-4238-8c71-38f2e9f66e53",
    CONTENT_TYPE_NAME: "Mobile",
    CONTENT_TYPE_L1_ID: "fcdfc914-4d9b-4f3a-9627-72fe2397c0a0",
    CONTENT_TYPE_L1_NAME: "Video Game",
    CONTENT_TYPE_L2_ID: "b931f70e-c4fd-4238-8c71-38f2e9f66e53",
    CONTENT_TYPE_L2_NAME: "Mobile",
    Description:
      "Games or Interactive content designed primarily for smartphone or tablet experiences.",
  },
  {
    CONTENT_TYPE_ID: "cb21ec17-93e9-4ef2-8adc-9c23c085c6d2",
    CONTENT_TYPE_NAME: "Console",
    CONTENT_TYPE_L1_ID: "fcdfc914-4d9b-4f3a-9627-72fe2397c0a0",
    CONTENT_TYPE_L1_NAME: "Video Game",
    CONTENT_TYPE_L2_ID: "cb21ec17-93e9-4ef2-8adc-9c23c085c6d2",
    CONTENT_TYPE_L2_NAME: "Console",
    Description:
      "Interactive titles optimized for dedicated gaming hardware like Xbox or PS5.",
  },
  {
    CONTENT_TYPE_ID: "3ef53e31-99fa-4cb6-950c-10f1d33ded55",
    CONTENT_TYPE_NAME: "PC",
    CONTENT_TYPE_L1_ID: "fcdfc914-4d9b-4f3a-9627-72fe2397c0a0",
    CONTENT_TYPE_L1_NAME: "Video Game",
    CONTENT_TYPE_L2_ID: "3ef53e31-99fa-4cb6-950c-10f1d33ded55",
    CONTENT_TYPE_L2_NAME: "PC",
    Description: "Interactive titles developed for personal-computer ecosystems.",
  },
  {
    CONTENT_TYPE_ID: "df009e98-5ab3-4422-ab66-09eab74a7ec9",
    CONTENT_TYPE_NAME: "Promotional",
    CONTENT_TYPE_L1_ID: "df009e98-5ab3-4422-ab66-09eab74a7ec9",
    CONTENT_TYPE_L1_NAME: "Promotional",
    CONTENT_TYPE_L2_ID: "",
    CONTENT_TYPE_L2_NAME: "",
    Description:
      "Media created to market, publicize, or support awareness of a product, brand, or entertainment property.",
  },
  {
    CONTENT_TYPE_ID: "2c144bec-02d1-45b0-8bfb-583fd5bddcfd",
    CONTENT_TYPE_NAME: "Advertising",
    CONTENT_TYPE_L1_ID: "df009e98-5ab3-4422-ab66-09eab74a7ec9",
    CONTENT_TYPE_L1_NAME: "Promotional",
    CONTENT_TYPE_L2_ID: "2c144bec-02d1-45b0-8bfb-583fd5bddcfd",
    CONTENT_TYPE_L2_NAME: "Advertising",
    Description:
      "Media works conceived and produced to convey persuasive or branded narratives through cinematic, animated, or graphic storytelling techniques.",
  },
  {
    CONTENT_TYPE_ID: "230f46ee-f72a-4a07-98b0-9d36ad57c2a4",
    CONTENT_TYPE_NAME: "Trailers",
    CONTENT_TYPE_L1_ID: "df009e98-5ab3-4422-ab66-09eab74a7ec9",
    CONTENT_TYPE_L1_NAME: "Promotional",
    CONTENT_TYPE_L2_ID: "230f46ee-f72a-4a07-98b0-9d36ad57c2a4",
    CONTENT_TYPE_L2_NAME: "Trailers",
    Description:
      "Edited compilations highlighting key visuals or narrative hooks to promote a creative work.",
  },
  {
    CONTENT_TYPE_ID: "39748644-77bc-4a1c-b5d6-de144a53a6a4",
    CONTENT_TYPE_NAME: "DesignViz",
    CONTENT_TYPE_L1_ID: "df009e98-5ab3-4422-ab66-09eab74a7ec9",
    CONTENT_TYPE_L1_NAME: "Promotional",
    CONTENT_TYPE_L2_ID: "39748644-77bc-4a1c-b5d6-de144a53a6a4",
    CONTENT_TYPE_L2_NAME: "DesignViz",
    Description:
      "Visual materials used to conceptualize, pitch, or communicate creative or technical design ideas.",
  },
  {
    CONTENT_TYPE_ID: "fc4a8ddf-a1a4-4c11-a6e2-934d0b90ccef",
    CONTENT_TYPE_NAME: "Music Videos",
    CONTENT_TYPE_L1_ID: "df009e98-5ab3-4422-ab66-09eab74a7ec9",
    CONTENT_TYPE_L1_NAME: "Promotional",
    CONTENT_TYPE_L2_ID: "fc4a8ddf-a1a4-4c11-a6e2-934d0b90ccef",
    CONTENT_TYPE_L2_NAME: "Music Videos",
    Description:
      "Promotional works combining audio recordings with creative visuals to extend a song’s artistic expression.",
  },
  {
    CONTENT_TYPE_ID: "f91c3b14-553b-4df7-949b-d9ecfc46818c",
    CONTENT_TYPE_NAME: "Corporate",
    CONTENT_TYPE_L1_ID: "df009e98-5ab3-4422-ab66-09eab74a7ec9",
    CONTENT_TYPE_L1_NAME: "Promotional",
    CONTENT_TYPE_L2_ID: "f91c3b14-553b-4df7-949b-d9ecfc46818c",
    CONTENT_TYPE_L2_NAME: "Corporate",
    Description:
      "Media assets produced to communicate internal initiatives, leadership messaging, or investor relations.",
  },
  {
    CONTENT_TYPE_ID: "27f4bf53-425e-4a64-b1e1-a59625762856",
    CONTENT_TYPE_NAME: "Explainer",
    CONTENT_TYPE_L1_ID: "df009e98-5ab3-4422-ab66-09eab74a7ec9",
    CONTENT_TYPE_L1_NAME: "Promotional",
    CONTENT_TYPE_L2_ID: "27f4bf53-425e-4a64-b1e1-a59625762856",
    CONTENT_TYPE_L2_NAME: "Explainer",
    Description:
      "Short informational pieces that simplify or demonstrate products, services, or complex ideas.",
  },
  {
    CONTENT_TYPE_ID: "37460c8a-3463-49ab-9c71-032024ac7ddb",
    CONTENT_TYPE_NAME: "Social",
    CONTENT_TYPE_L1_ID: "37460c8a-3463-49ab-9c71-032024ac7ddb",
    CONTENT_TYPE_L1_NAME: "Social",
    CONTENT_TYPE_L2_ID: "",
    CONTENT_TYPE_L2_NAME: "",
    Description:
      "Short-form or episodic creative works created for social platforms, optimized for engagement and shareability.",
  },
  {
    CONTENT_TYPE_ID: "44973ca0-8f95-4cfe-a80a-c8ff8d72e18f",
    CONTENT_TYPE_NAME: "Unscripted",
    CONTENT_TYPE_L1_ID: "44973ca0-8f95-4cfe-a80a-c8ff8d72e18f",
    CONTENT_TYPE_L1_NAME: "Unscripted",
    CONTENT_TYPE_L2_ID: "",
    CONTENT_TYPE_L2_NAME: "",
    Description:
      "Non-fictional creative works capturing real events, people, or performances without a predefined script.",
  },
  {
    CONTENT_TYPE_ID: "225cc11b-5d61-4d10-983a-08f8aa55ebf0",
    CONTENT_TYPE_NAME: "Documentary",
    CONTENT_TYPE_L1_ID: "44973ca0-8f95-4cfe-a80a-c8ff8d72e18f",
    CONTENT_TYPE_L1_NAME: "Unscripted",
    CONTENT_TYPE_L2_ID: "225cc11b-5d61-4d10-983a-08f8aa55ebf0",
    CONTENT_TYPE_L2_NAME: "Documentary",
    Description:
      "Fact-based storytelling exploring real subjects, themes, or events through observation and interviews.",
  },
  {
    CONTENT_TYPE_ID: "92b43069-7b60-488e-9006-4c268066b8ba",
    CONTENT_TYPE_NAME: "Sports Broadcast",
    CONTENT_TYPE_L1_ID: "44973ca0-8f95-4cfe-a80a-c8ff8d72e18f",
    CONTENT_TYPE_L1_NAME: "Unscripted",
    CONTENT_TYPE_L2_ID: "92b43069-7b60-488e-9006-4c268066b8ba",
    CONTENT_TYPE_L2_NAME: "Sports Broadcast",
    Description:
      "Live or recorded coverage of athletic events and related commentary.",
  },
  {
    CONTENT_TYPE_ID: "e6c7d6ef-99d5-43e9-ad77-f3e8f43ff168",
    CONTENT_TYPE_NAME: "Talk Shows",
    CONTENT_TYPE_L1_ID: "44973ca0-8f95-4cfe-a80a-c8ff8d72e18f",
    CONTENT_TYPE_L1_NAME: "Unscripted",
    CONTENT_TYPE_L2_ID: "e6c7d6ef-99d5-43e9-ad77-f3e8f43ff168",
    CONTENT_TYPE_L2_NAME: "Talk Shows",
    Description:
      "Studio-based programs built around discussion, interviews, or cultural commentary.",
  },
  {
    CONTENT_TYPE_ID: "7bc90eaa-49da-44b2-a33f-c2a4f9a24582",
    CONTENT_TYPE_NAME: "Game Shows",
    CONTENT_TYPE_L1_ID: "44973ca0-8f95-4cfe-a80a-c8ff8d72e18f",
    CONTENT_TYPE_L1_NAME: "Unscripted",
    CONTENT_TYPE_L2_ID: "7bc90eaa-49da-44b2-a33f-c2a4f9a24582",
    CONTENT_TYPE_L2_NAME: "Game Shows",
    Description:
      "Competition programs where participants engage in games or challenges for rewards.",
  },
  {
    CONTENT_TYPE_ID: "c2ee8c87-19b0-4aac-9f07-367061ee2867",
    CONTENT_TYPE_NAME: "News Broadcast",
    CONTENT_TYPE_L1_ID: "44973ca0-8f95-4cfe-a80a-c8ff8d72e18f",
    CONTENT_TYPE_L1_NAME: "Unscripted",
    CONTENT_TYPE_L2_ID: "c2ee8c87-19b0-4aac-9f07-367061ee2867",
    CONTENT_TYPE_L2_NAME: "News Broadcast",
    Description:
      "Live or pre-recorded journalistic programming reporting current events.",
  },
  {
    CONTENT_TYPE_ID: "1565064d-ae50-43be-98ae-139acb250e8b",
    CONTENT_TYPE_NAME: "Radio",
    CONTENT_TYPE_L1_ID: "44973ca0-8f95-4cfe-a80a-c8ff8d72e18f",
    CONTENT_TYPE_L1_NAME: "Unscripted",
    CONTENT_TYPE_L2_ID: "1565064d-ae50-43be-98ae-139acb250e8b",
    CONTENT_TYPE_L2_NAME: "Radio",
    Description:
      "The wireless transmission of audio content, such as music, news, and commentary, via electromagnetic radio waves to a wide public audience equipped with receivers",
  },
  {
    CONTENT_TYPE_ID: "dd60d52f-901f-4d85-bbe3-c6ac76eaad3e",
    CONTENT_TYPE_NAME: "Podcast",
    CONTENT_TYPE_L1_ID: "44973ca0-8f95-4cfe-a80a-c8ff8d72e18f",
    CONTENT_TYPE_L1_NAME: "Unscripted",
    CONTENT_TYPE_L2_ID: "dd60d52f-901f-4d85-bbe3-c6ac76eaad3e",
    CONTENT_TYPE_L2_NAME: "Podcast",
    Description: "A podcast is an on-demand, episodic series of digital audio files",
  },
  {
    CONTENT_TYPE_ID: "e7990e17-39f2-48d2-b1e7-3ff3989f0767",
    CONTENT_TYPE_NAME: "Television",
    CONTENT_TYPE_L1_ID: "44973ca0-8f95-4cfe-a80a-c8ff8d72e18f",
    CONTENT_TYPE_L1_NAME: "Unscripted",
    CONTENT_TYPE_L2_ID: "e7990e17-39f2-48d2-b1e7-3ff3989f0767",
    CONTENT_TYPE_L2_NAME: "Television",
    Description:
      "The transmission of audio-visual content, like television shows, to a wide audience via over-the-air radio waves, satellite, or cable",
  },
  {
    CONTENT_TYPE_ID: "4351a5fb-d876-4558-8263-06829003cc65",
    CONTENT_TYPE_NAME: "Broadcast",
    CONTENT_TYPE_L1_ID: "44973ca0-8f95-4cfe-a80a-c8ff8d72e18f",
    CONTENT_TYPE_L1_NAME: "Unscripted",
    CONTENT_TYPE_L2_ID: "4351a5fb-d876-4558-8263-06829003cc65",
    CONTENT_TYPE_L2_NAME: "Broadcast",
    Description:
      "The transmission of audio, video, or data signals to a wide, dispersed audience via an electronic mass communication medium, such as radio, television, or the internet.",
  },
  {
    CONTENT_TYPE_ID: "40983d0a-3aff-46b7-844c-3ebf48a2c649",
    CONTENT_TYPE_NAME: "Reality",
    CONTENT_TYPE_L1_ID: "44973ca0-8f95-4cfe-a80a-c8ff8d72e18f",
    CONTENT_TYPE_L1_NAME: "Unscripted",
    CONTENT_TYPE_L2_ID: "40983d0a-3aff-46b7-844c-3ebf48a2c649",
    CONTENT_TYPE_L2_NAME: "Reality",
    Description:
      "Observational programming documenting real people or situations in unscripted environments.",
  },
  {
    CONTENT_TYPE_ID: "a1781571-17fc-497b-8fd6-c42175df8ea7",
    CONTENT_TYPE_NAME: "Location-Based",
    CONTENT_TYPE_L1_ID: "a1781571-17fc-497b-8fd6-c42175df8ea7",
    CONTENT_TYPE_L1_NAME: "Location-Based",
    CONTENT_TYPE_L2_ID: "",
    CONTENT_TYPE_L2_NAME: "",
    Description:
      "Immersive experiences situated in physical spaces, integrating media, performance, or technology for public engagement.",
  },
  {
    CONTENT_TYPE_ID: "7caf4eaa-3ff0-44f4-beeb-809baa9e5aa3",
    CONTENT_TYPE_NAME: "Mixed-Media Performance",
    CONTENT_TYPE_L1_ID: "a1781571-17fc-497b-8fd6-c42175df8ea7",
    CONTENT_TYPE_L1_NAME: "Location-Based",
    CONTENT_TYPE_L2_ID: "7caf4eaa-3ff0-44f4-beeb-809baa9e5aa3",
    CONTENT_TYPE_L2_NAME: "Mixed-Media Performance",
    Description: "Live presentations blending digital projections, sound, and physical performance.",
  },
  {
    CONTENT_TYPE_ID: "2347ac72-b5a0-4fde-bfcb-0fd1c7f0fbce",
    CONTENT_TYPE_NAME: "Mixed-Media Installation",
    CONTENT_TYPE_L1_ID: "a1781571-17fc-497b-8fd6-c42175df8ea7",
    CONTENT_TYPE_L1_NAME: "Location-Based",
    CONTENT_TYPE_L2_ID: "2347ac72-b5a0-4fde-bfcb-0fd1c7f0fbce",
    CONTENT_TYPE_L2_NAME: "Mixed-Media Installation",
    Description: "Fixed or temporary spatial artworks combining screens, sensors, and interactivity.",
  },
  {
    CONTENT_TYPE_ID: "91a52572-f934-464d-9250-1d71760558f4",
    CONTENT_TYPE_NAME: "Mixed-Media Attraction",
    CONTENT_TYPE_L1_ID: "a1781571-17fc-497b-8fd6-c42175df8ea7",
    CONTENT_TYPE_L1_NAME: "Location-Based",
    CONTENT_TYPE_L2_ID: "91a52572-f934-464d-9250-1d71760558f4",
    CONTENT_TYPE_L2_NAME: "Mixed-Media Attraction",
    Description:
      "Permanent entertainment venues integrating narrative design, projection, and real-world interaction.",
  },
  {
    CONTENT_TYPE_ID: "cf11a257-a30a-46e9-beae-68986db96fbe",
    CONTENT_TYPE_NAME: "Mixed-Media Exhibit",
    CONTENT_TYPE_L1_ID: "a1781571-17fc-497b-8fd6-c42175df8ea7",
    CONTENT_TYPE_L1_NAME: "Location-Based",
    CONTENT_TYPE_L2_ID: "cf11a257-a30a-46e9-beae-68986db96fbe",
    CONTENT_TYPE_L2_NAME: "Mixed Media Exhibit",
    Description:
      "Curated displays merging audiovisual storytelling with educational or cultural themes.",
  },
  {
    CONTENT_TYPE_ID: "66cb3f9c-0438-42ff-ade0-a43c425e614c",
    CONTENT_TYPE_NAME: "Traditional",
    CONTENT_TYPE_L1_ID: "66cb3f9c-0438-42ff-ade0-a43c425e614c",
    CONTENT_TYPE_L1_NAME: "Traditional",
    CONTENT_TYPE_L2_ID: "",
    CONTENT_TYPE_L2_NAME: "",
    Description:
      "Legacy print, or linear-distribution formats predating digital streaming ecosystems.",
  },
  {
    CONTENT_TYPE_ID: "7a063108-fe4a-4ac3-ba3c-481352ec452a",
    CONTENT_TYPE_NAME: "Audio",
    CONTENT_TYPE_L1_ID: "66cb3f9c-0438-42ff-ade0-a43c425e614c",
    CONTENT_TYPE_L1_NAME: "Traditional",
    CONTENT_TYPE_L2_ID: "7a063108-fe4a-4ac3-ba3c-481352ec452a",
    CONTENT_TYPE_L2_NAME: "Audio",
    Description: "Media focused on sound-driven storytelling or expression.",
  },
  {
    CONTENT_TYPE_ID: "6d9611ac-d056-4b08-9597-61595b5dbca7",
    CONTENT_TYPE_NAME: "Still",
    CONTENT_TYPE_L1_ID: "66cb3f9c-0438-42ff-ade0-a43c425e614c",
    CONTENT_TYPE_L1_NAME: "Traditional",
    CONTENT_TYPE_L2_ID: "6d9611ac-d056-4b08-9597-61595b5dbca7",
    CONTENT_TYPE_L2_NAME: "Still",
    Description: "Static imagery or photography-based creative works.",
  },
  {
    CONTENT_TYPE_ID: "590185b5-be81-49b1-b9c1-616226f3dc74",
    CONTENT_TYPE_NAME: "Books",
    CONTENT_TYPE_L1_ID: "66cb3f9c-0438-42ff-ade0-a43c425e614c",
    CONTENT_TYPE_L1_NAME: "Traditional",
    CONTENT_TYPE_L2_ID: "59d5f122-b842-44c3-9d60-668d9f2920c9",
    CONTENT_TYPE_L2_NAME: "Books",
    Description: "Long-form textual works published physically or digitally.",
  },
  {
    CONTENT_TYPE_ID: "59d5f122-b842-44c3-9d60-668d9f2920c9",
    CONTENT_TYPE_NAME: "Text-Based",
    CONTENT_TYPE_L1_ID: "66cb3f9c-0438-42ff-ade0-a43c425e614c",
    CONTENT_TYPE_L1_NAME: "Traditional",
    CONTENT_TYPE_L2_ID: "59d5f122-b842-44c3-9d60-668d9f2920c9",
    CONTENT_TYPE_L2_NAME: "Text-based",
    Description:
      "Written creative or informational works distributed in digital or print form.",
  },
];

function normalize(s) {
  return String(s || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}


function Pill({ children }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 12px",
        borderRadius: 999,
        border: `1px solid rgba(30,42,120,0.22)`,
        background: "rgba(207,239,247,0.55)",
        color: BRAND.ink,
        fontWeight: 900,
        fontSize: 12,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Segmented({ value, onChange, options }) {
  return (
    <div
      style={{
        display: "inline-flex",
        borderRadius: 14,
        border: `1px solid rgba(30,42,120,0.22)`,
        background: "#FFFFFF",
        overflow: "hidden",
        boxShadow: "0 16px 50px rgba(30,42,120,0.08)",
      }}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              border: "none",
              cursor: "pointer",
              padding: "10px 12px",
              fontWeight: 1000,
              background: active ? BRAND.fill : "#FFFFFF",
              color: active ? BRAND.ink : "rgba(17,24,39,0.78)",
              borderRight: "1px solid rgba(30,42,120,0.12)",
              minWidth: 160,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function RowButton({ children, onClick, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
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
    >
      {children}
    </button>
  );
}

/**
 * This page expects a server endpoint we’ll add next:
 * GET /api/orgs/content-types/counts
 *   -> { totalsByType: { [typeName]: number }, totalOrgs: number }
 *
 * If not present yet, it shows a friendly “Waiting for counts endpoint” state.
 */
export default function ContentTypes() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("reference"); // reference | counts
  const [search, setSearch] = useState("");

  // expand/collapse
  const [openL1, setOpenL1] = useState(() => new Set());

  // selection
  const [selected, setSelected] = useState(() => new Set());
  const [matchMode, setMatchMode] = useState("any"); // any | all

  // counts from orgs.csv (via server endpoint)
  const [countsLoading, setCountsLoading] = useState(false);
  const [countsError, setCountsError] = useState("");
  const [totalsByType, setTotalsByType] = useState(null);
  const [totalOrgs, setTotalOrgs] = useState(null);

  const hierarchy = useMemo(() => {
    const byL1 = new Map();

    for (const r of CONTENT_TYPES_REFERENCE) {
      const l1 = String(r.CONTENT_TYPE_L1_NAME || "").trim();
      const l2 = String(r.CONTENT_TYPE_L2_NAME || "").trim();

      if (!l1) continue;

      if (!byL1.has(l1)) {
        byL1.set(l1, {
          l1,
          l1Desc: "",
          l2: [],
        });
      }

      const bucket = byL1.get(l1);

      // store the L1 description from the row where L2 is blank, else keep first non-empty
      const isL1Row = !l2;
      if (isL1Row && r.Description) bucket.l1Desc = r.Description;

      if (l2) {
        bucket.l2.push({
          l1,
          l2,
          desc: r.Description || "",
        });
      }
    }

    // sort L1 and L2 for stable UX
    const arr = Array.from(byL1.values()).sort((a, b) => a.l1.localeCompare(b.l1));
    for (const node of arr) node.l2.sort((a, b) => a.l2.localeCompare(b.l2));

    return arr;
  }, []);

  const filteredHierarchy = useMemo(() => {
    const q = normalize(search);
    if (!q) return hierarchy;

    return hierarchy
      .map((l1) => {
        const l1Hit =
          normalize(l1.l1).includes(q) || normalize(l1.l1Desc).includes(q);

        const l2Hits = l1.l2.filter(
          (x) =>
            normalize(x.l2).includes(q) || normalize(x.desc).includes(q)
        );

        if (l1Hit) return l1;
        if (l2Hits.length > 0) return { ...l1, l2: l2Hits };
        return null;
      })
      .filter(Boolean);
  }, [hierarchy, search]);

  function toggleL1(l1) {
    setOpenL1((prev) => {
      const next = new Set(Array.from(prev));
      if (next.has(l1)) next.delete(l1);
      else next.add(l1);
      return next;
    });
  }

  function toggleSelected(typeName) {
    const t = String(typeName || "").trim();
    if (!t) return;

    setSelected((prev) => {
      const next = new Set(Array.from(prev));
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function openAllL1() {
    setOpenL1(new Set(hierarchy.map((x) => x.l1)));
  }

  function closeAllL1() {
    setOpenL1(new Set());
  }

  async function fetchCounts() {
    setCountsLoading(true);
    setCountsError("");
    try {
      const res = await fetch(base+"/api/orgs/content-types/counts");
      if (!res.ok) {
        throw new Error(`Counts endpoint not ready (${res.status})`);
      }
      const json = await res.json();
      setTotalsByType(json?.totalsByType || {});
      setTotalOrgs(Number(json?.totalOrgs || 0));
    } catch (e) {
      console.error(e);
      setTotalsByType(null);
      setTotalOrgs(null);
      setCountsError(
        "Counts are not available yet. Next file will add the server endpoint to compute counts from orgs.csv."
      );
    } finally {
      setCountsLoading(false);
    }
  }

  useEffect(() => {
    if (tab !== "counts") return;
    if (totalsByType) return; // already have it
    fetchCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const selectedList = useMemo(() => Array.from(selected), [selected]);

  const selectionSummary = useMemo(() => {
    if (selected.size === 0) return null;
    const items = Array.from(selected);
    items.sort((a, b) => a.localeCompare(b));
    return items;
  }, [selected]);

  function viewOrgsWithSelection() {
    if (selected.size === 0) return;

    // We’ll wire OrganizationsSearch to read these next:
    // CONTENT_TYPES = comma-separated token list
    // CT_MATCH = any|all
    const params = new URLSearchParams();
    params.set("CONTENT_TYPES", Array.from(selected).join(","));
    params.set("CT_MATCH", matchMode);

    navigate(`/participants/organizations?${params.toString()}`);
  }

  function countFor(typeName) {
    if (!totalsByType) return null;
    const key = String(typeName || "").trim();
    if (!key) return 0;

    // Robust lookup: try exact key (in case server returns display-case keys),
    // then normalized-lower key (matches our server convention).
    return (
      totalsByType?.[key] ??
      totalsByType?.[normalize(key)] ??
      0
    );
  }

  function l1Total(l1Node) {
    // total = count of L1 token + L2 token matches
    // Note: This counts organizations that mention tokens; if an org has multiple tokens in this branch,
    // a naive sum can overcount. We’ll avoid that later by computing branch totals server-side.
    // For now, display the L1 token count (most honest) + show L2 breakdown.
    if (!totalsByType) return null;
    return countFor(l1Node.l1);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BRAND.bg,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        color: BRAND.text,
        paddingBottom: selected.size > 0 ? 96 : 26, // make room for sticky bar
      }}
    >
      {/* Header */}
      <div style={{ padding: "22px 26px 10px" }}>
        <div
          style={{
            maxWidth: PAGE.max,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
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
                boxShadow: "0 10px 34px rgba(30,42,120,0.12)",
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
            <span style={{ fontWeight: 1000, opacity: 0.95 }}>Content Types</span>

            {selected.size > 0 ? (
              <Pill>
                {selected.size} selected • Match: {matchMode.toUpperCase()}
              </Pill>
            ) : null}
          </div>

          <a
            href="https://me-dmz.com"
            target="_blank"
            rel="noreferrer"
            style={{
              textDecoration: "none",
              color: BRAND.ink,
              fontWeight: 1000,
              opacity: 0.92,
              padding: "10px 12px",
              borderRadius: 12,
              border: `1px solid rgba(30,42,120,0.18)`,
              background: "#FFFFFF",
            }}
          >
            ME-DMZ ↗
          </a>
        </div>
      </div>

      {/* Hero */}
      <div style={{ padding: "0 26px 16px" }}>
        <div
          style={{
            maxWidth: PAGE.max,
            margin: "0 auto",
            background: "#FFFFFF",
            borderRadius: 18,
            border: `1px solid rgba(30,42,120,0.14)`,
            boxShadow: "0 22px 80px rgba(30,42,120,0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: 18,
              borderBottom: "1px solid rgba(30,42,120,0.12)",
              background:
                "linear-gradient(180deg, rgba(207,239,247,0.55), rgba(255,255,255,0.90))",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 1000, color: "rgba(30,42,120,0.75)" }}>
              PARTICIPANT ORGANIZATIONS
            </div>
            <h1 style={{ margin: "6px 0 6px", fontSize: 32, fontWeight: 1100, color: BRAND.ink }}>
              Content Types
            </h1>
            <p style={{ margin: 0, maxWidth: 1200, fontWeight: 850, opacity: 0.85, lineHeight: 1.35 }}>
              {CONTENT_TYPE_DEFINITION}
            </p>
          </div>

          <div style={{ padding: 18, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <Segmented
              value={tab}
              onChange={setTab}
              options={[
                { value: "reference", label: "Reference (Definitions)" },
                { value: "counts", label: "Org Counts (Hierarchy)" },
              ]}
            />

            <div style={{ flex: 1 }} />

            <div
              style={{
                minWidth: 320,
                flex: "1 1 420px",
                background: "#FFFFFF",
                border: `1px solid rgba(30,42,120,0.16)`,
                borderRadius: 16,
                boxShadow: "0 16px 56px rgba(30,42,120,0.07)",
                overflow: "hidden",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 12px" }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    background: BRAND.fill,
                    display: "grid",
                    placeItems: "center",
                    color: BRAND.ink,
                    fontWeight: 1000,
                  }}
                >
                  🔎
                </div>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search content types (L1/L2/description)…"
                  style={{
                    border: "none",
                    outline: "none",
                    width: "100%",
                    fontSize: 14,
                    fontWeight: 850,
                    color: BRAND.text,
                  }}
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontWeight: 1000,
                      color: "rgba(30,42,120,0.75)",
                      padding: "6px 10px",
                      borderRadius: 10,
                    }}
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={openAllL1}
                style={{
                  border: `1px solid rgba(30,42,120,0.18)`,
                  background: "#FFFFFF",
                  color: BRAND.ink,
                  fontWeight: 1000,
                  padding: "10px 12px",
                  borderRadius: 12,
                  cursor: "pointer",
                }}
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={closeAllL1}
                style={{
                  border: `1px solid rgba(30,42,120,0.18)`,
                  background: "#FFFFFF",
                  color: BRAND.ink,
                  fontWeight: 1000,
                  padding: "10px 12px",
                  borderRadius: 12,
                  cursor: "pointer",
                }}
              >
                Collapse All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "0 26px 26px" }}>
        <div style={{ maxWidth: PAGE.max, margin: "0 auto", display: "grid", gap: 16 }}>
          {/* Table shell */}
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 18,
              border: `1px solid rgba(30,42,120,0.14)`,
              boxShadow: "0 22px 80px rgba(30,42,120,0.08)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 14px",
                borderBottom: "1px solid rgba(30,42,120,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                background:
                  "linear-gradient(180deg, rgba(207,239,247,0.55), rgba(255,255,255,0.92))",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <Pill>
                  {tab === "reference"
                    ? "Definitions & Hierarchy"
                    : "Org Counts (computed from orgs.csv)"}
                </Pill>

                {tab === "counts" ? (
                  countsLoading ? (
                    <Pill>Loading counts…</Pill>
                  ) : totalsByType ? (
                    <Pill>Total Orgs: {Number(totalOrgs || 0).toLocaleString()}</Pill>
                  ) : (
                    <Pill>Counts Pending</Pill>
                  )
                ) : null}
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                {tab === "counts" ? (
                  <button
                    type="button"
                    onClick={fetchCounts}
                    style={{
                      border: `1px solid rgba(30,42,120,0.18)`,
                      background: "#FFFFFF",
                      color: BRAND.ink,
                      fontWeight: 1000,
                      padding: "10px 12px",
                      borderRadius: 12,
                      cursor: "pointer",
                    }}
                    title="Recompute counts"
                  >
                    Refresh Counts
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => navigate("/participants/organizations")}
                  style={{
                    border: `1px solid rgba(30,42,120,0.18)`,
                    background: "#FFFFFF",
                    color: BRAND.ink,
                    fontWeight: 1000,
                    padding: "10px 12px",
                    borderRadius: 12,
                    cursor: "pointer",
                  }}
                >
                  ← Back to Orgs
                </button>
              </div>
            </div>

            {tab === "counts" && countsError ? (
              <div style={{ padding: 14 }}>
                <div
                  style={{
                    border: `1px dashed rgba(30,42,120,0.25)`,
                    borderRadius: 16,
                    padding: 14,
                    background: "rgba(207,239,247,0.22)",
                    color: BRAND.ink,
                    fontWeight: 950,
                    lineHeight: 1.35,
                  }}
                >
                  {countsError}
                </div>
              </div>
            ) : null}

            <div style={{ overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "12px 12px",
                        fontSize: 12,
                        letterSpacing: 0.3,
                        fontWeight: 1100,
                        color: BRAND.ink,
                        background: "#FFFFFF",
                        borderBottom: "1px solid rgba(30,42,120,0.14)",
                        whiteSpace: "nowrap",
                        width: 44,
                      }}
                    >
                      Select
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "12px 12px",
                        fontSize: 12,
                        letterSpacing: 0.3,
                        fontWeight: 1100,
                        color: BRAND.ink,
                        background: "#FFFFFF",
                        borderBottom: "1px solid rgba(30,42,120,0.14)",
                        whiteSpace: "nowrap",
                        width: 360,
                      }}
                    >
                      Content Type (Hierarchy)
                    </th>

                    {tab === "counts" ? (
                      <th
                        style={{
                          textAlign: "right",
                          padding: "12px 12px",
                          fontSize: 12,
                          letterSpacing: 0.3,
                          fontWeight: 1100,
                          color: BRAND.ink,
                          background: "#FFFFFF",
                          borderBottom: "1px solid rgba(30,42,120,0.14)",
                          whiteSpace: "nowrap",
                          width: 160,
                        }}
                      >
                        Count of Orgs
                      </th>
                    ) : null}

                    <th
                      style={{
                        textAlign: "left",
                        padding: "12px 12px",
                        fontSize: 12,
                        letterSpacing: 0.3,
                        fontWeight: 1100,
                        color: BRAND.ink,
                        background: "#FFFFFF",
                        borderBottom: "1px solid rgba(30,42,120,0.14)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Description
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredHierarchy.map((node, idx) => {
                    const isOpen = openL1.has(node.l1);
                    const zebra = idx % 2 === 0 ? "rgba(247,251,254,0.72)" : "#FFFFFF";

                    const l1Count = tab === "counts" ? l1Total(node) : null;

                    return (
                      <Fragment key={node.l1}>
                        {/* L1 row */}
                        <tr style={{ background: zebra }}>
                          <td
                            style={{
                              padding: "12px 12px",
                              borderBottom: "1px solid rgba(30,42,120,0.08)",
                              verticalAlign: "top",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selected.has(node.l1)}
                              onChange={() => toggleSelected(node.l1)}
                              style={{ width: 16, height: 16, cursor: "pointer" }}
                              aria-label={`Select ${node.l1}`}
                            />
                          </td>

                          <td
                            style={{
                              padding: "12px 12px",
                              borderBottom: "1px solid rgba(30,42,120,0.08)",
                              verticalAlign: "top",
                              fontSize: 14,
                              fontWeight: 1100,
                              color: BRAND.text,
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <button
                                type="button"
                                onClick={() => toggleL1(node.l1)}
                                style={{
                                  border: `1px solid rgba(30,42,120,0.18)`,
                                  background: "#FFFFFF",
                                  color: BRAND.ink,
                                  fontWeight: 1100,
                                  width: 34,
                                  height: 34,
                                  borderRadius: 12,
                                  cursor: "pointer",
                                  display: "grid",
                                  placeItems: "center",
                                }}
                                title={isOpen ? "Collapse" : "Expand"}
                              >
                                {node.l2.length > 0 ? (isOpen ? "–" : "+") : "•"}
                              </button>

                              <div style={{ display: "grid", gap: 4 }}>
                                <div style={{ fontWeight: 1150 }}>
                                  {node.l1}
                                  <span style={{ marginLeft: 10, opacity: 0.55, fontWeight: 950 }}>
                                    (L1)
                                  </span>
                                </div>

                                {node.l2.length > 0 ? (
                                  <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.72 }}>
                                    {node.l2.length} sub-type{node.l2.length === 1 ? "" : "s"}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </td>

                          {tab === "counts" ? (
                            <td
                              style={{
                                padding: "12px 12px",
                                borderBottom: "1px solid rgba(30,42,120,0.08)",
                                verticalAlign: "top",
                                textAlign: "right",
                                fontSize: 13,
                                fontWeight: 1100,
                                color: BRAND.ink,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {totalsByType ? (
                                <RowButton
                                  onClick={() => toggleSelected(node.l1)}
                                  title="Click to toggle selection"
                                >
                                  {(l1Count ?? 0).toLocaleString()}
                                </RowButton>
                              ) : (
                                <span style={{ opacity: 0.55 }}>—</span>
                              )}
                            </td>
                          ) : null}

                          <td
                            style={{
                              padding: "12px 12px",
                              borderBottom: "1px solid rgba(30,42,120,0.08)",
                              verticalAlign: "top",
                              fontSize: 13,
                              fontWeight: 850,
                              opacity: 0.9,
                              lineHeight: 1.35,
                            }}
                          >
                            {node.l1Desc || <span style={{ opacity: 0.55 }}>—</span>}
                          </td>
                        </tr>

                        {/* L2 rows */}
                        {isOpen &&
                          node.l2.map((child, j) => {
                            const childCount = tab === "counts" ? countFor(child.l2) : null;
                            return (
                              <tr
                                key={`${node.l1}:${child.l2}:${j}`}
                                style={{
                                  background: "#FFFFFF",
                                }}
                              >
                                <td
                                  style={{
                                    padding: "12px 12px",
                                    borderBottom: "1px solid rgba(30,42,120,0.08)",
                                    verticalAlign: "top",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selected.has(child.l2)}
                                    onChange={() => toggleSelected(child.l2)}
                                    style={{ width: 16, height: 16, cursor: "pointer" }}
                                    aria-label={`Select ${child.l2}`}
                                  />
                                </td>

                                <td
                                  style={{
                                    padding: "12px 12px",
                                    borderBottom: "1px solid rgba(30,42,120,0.08)",
                                    verticalAlign: "top",
                                    fontSize: 13,
                                    fontWeight: 1000,
                                    color: BRAND.text,
                                  }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div
                                      style={{
                                        width: 34,
                                        height: 34,
                                        borderRadius: 12,
                                        background: "rgba(207,239,247,0.35)",
                                        border: `1px solid rgba(30,42,120,0.16)`,
                                        display: "grid",
                                        placeItems: "center",
                                        color: BRAND.ink,
                                        fontWeight: 1100,
                                      }}
                                      title="L2"
                                    >
                                      ↳
                                    </div>

                                    <div style={{ display: "grid", gap: 4 }}>
                                      <div style={{ fontWeight: 1100 }}>
                                        {child.l2}
                                        <span style={{ marginLeft: 10, opacity: 0.55, fontWeight: 950 }}>
                                          (L2)
                                        </span>
                                      </div>
                                      <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.72 }}>
                                        Parent: {child.l1}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {tab === "counts" ? (
                                  <td
                                    style={{
                                      padding: "12px 12px",
                                      borderBottom: "1px solid rgba(30,42,120,0.08)",
                                      verticalAlign: "top",
                                      textAlign: "right",
                                      fontSize: 13,
                                      fontWeight: 1100,
                                      color: BRAND.ink,
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {totalsByType ? (
                                      <RowButton
                                        onClick={() => toggleSelected(child.l2)}
                                        title="Click to toggle selection"
                                      >
                                        {(childCount ?? 0).toLocaleString()}
                                      </RowButton>
                                    ) : (
                                      <span style={{ opacity: 0.55 }}>—</span>
                                    )}
                                  </td>
                                ) : null}

                                <td
                                  style={{
                                    padding: "12px 12px",
                                    borderBottom: "1px solid rgba(30,42,120,0.08)",
                                    verticalAlign: "top",
                                    fontSize: 13,
                                    fontWeight: 850,
                                    opacity: 0.9,
                                    lineHeight: 1.35,
                                  }}
                                >
                                  {child.desc || <span style={{ opacity: 0.55 }}>—</span>}
                                </td>
                              </tr>
                            );
                          })}
                      </Fragment>
                    );
                  })}

                  {filteredHierarchy.length === 0 ? (
                    <tr>
                      <td colSpan={tab === "counts" ? 4 : 3} style={{ padding: 18 }}>
                        <div
                          style={{
                            border: `1px dashed rgba(30,42,120,0.25)`,
                            borderRadius: 16,
                            padding: 14,
                            background: "rgba(207,239,247,0.20)",
                            color: BRAND.ink,
                            fontWeight: 950,
                          }}
                        >
                          No results. Try a different search query.
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          {/* Selection chips (sleek) */}
          {selectionSummary && selectionSummary.length > 0 ? (
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 18,
                border: `1px solid rgba(30,42,120,0.14)`,
                boxShadow: "0 22px 80px rgba(30,42,120,0.06)",
                padding: 14,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 1100, color: BRAND.ink, marginRight: 6 }}>
                Selected:
              </div>
              {selectionSummary.slice(0, 18).map((t) => (
                <span
                  key={t}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: 999,
                    border: `1px solid rgba(30,42,120,0.22)`,
                    background: "rgba(207,239,247,0.45)",
                    color: BRAND.ink,
                    fontWeight: 1000,
                    fontSize: 12,
                    maxWidth: 320,
                  }}
                  title={t}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleSelected(t)}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontWeight: 1100,
                      color: "rgba(30,42,120,0.75)",
                    }}
                    title="Remove"
                  >
                    ✕
                  </button>
                </span>
              ))}

              {selectionSummary.length > 18 ? (
                <span style={{ fontWeight: 950, opacity: 0.7 }}>
                  +{selectionSummary.length - 18} more
                </span>
              ) : null}

              <div style={{ flex: 1 }} />
              <button
                type="button"
                onClick={clearSelection}
                style={{
                  border: `1px solid rgba(30,42,120,0.18)`,
                  background: "#FFFFFF",
                  color: BRAND.ink,
                  fontWeight: 1000,
                  padding: "10px 12px",
                  borderRadius: 12,
                  cursor: "pointer",
                }}
              >
                Clear Selection
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Sticky bottom action bar */}
      {selected.size > 0 ? (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 80,
            padding: "12px 14px",
            background: "rgba(247,251,254,0.86)",
            borderTop: "1px solid rgba(30,42,120,0.14)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            style={{
              maxWidth: PAGE.max,
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <Pill>{selected.size} selected</Pill>

              <div
                style={{
                  display: "inline-flex",
                  borderRadius: 14,
                  border: `1px solid rgba(30,42,120,0.22)`,
                  overflow: "hidden",
                  background: "#FFFFFF",
                }}
              >
                <button
                  type="button"
                  onClick={() => setMatchMode("any")}
                  style={{
                    border: "none",
                    cursor: "pointer",
                    padding: "10px 12px",
                    fontWeight: 1100,
                    background: matchMode === "any" ? BRAND.fill : "#FFFFFF",
                    color: matchMode === "any" ? BRAND.ink : "rgba(17,24,39,0.75)",
                    borderRight: "1px solid rgba(30,42,120,0.12)",
                  }}
                  title="Match orgs that have ANY of the selected content types"
                >
                  ANY (OR)
                </button>
                <button
                  type="button"
                  onClick={() => setMatchMode("all")}
                  style={{
                    border: "none",
                    cursor: "pointer",
                    padding: "10px 12px",
                    fontWeight: 1100,
                    background: matchMode === "all" ? BRAND.fill : "#FFFFFF",
                    color: matchMode === "all" ? BRAND.ink : "rgba(17,24,39,0.75)",
                  }}
                  title="Match orgs that have ALL of the selected content types"
                >
                  ALL (AND)
                </button>
              </div>

              <span style={{ fontWeight: 900, opacity: 0.75 }}>
                Then open Organizations Search with filters applied.
              </span>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                type="button"
                onClick={clearSelection}
                style={{
                  border: `1px solid rgba(30,42,120,0.18)`,
                  background: "#FFFFFF",
                  color: BRAND.ink,
                  fontWeight: 1000,
                  padding: "10px 12px",
                  borderRadius: 12,
                  cursor: "pointer",
                }}
              >
                Clear
              </button>

              <button
                type="button"
                onClick={viewOrgsWithSelection}
                style={{
                  border: "none",
                  background: BRAND.ink,
                  color: "#FFFFFF",
                  fontWeight: 1100,
                  padding: "12px 14px",
                  borderRadius: 14,
                  cursor: "pointer",
                  boxShadow: "0 16px 60px rgba(30,42,120,0.22)",
                }}
              >
                View Orgs →
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

