import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Plus,
  Crown,
  Tv,
  X,
  Share2,
  Users,
  Sparkles,
  Bookmark,
  Smile,
  Home,
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
  Trash2,
  ChevronDown,
  Copy,
  ClipboardPaste,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import * as api from "./api";
import { Avatar, avatarColorFor } from "./avatars";

const PAL = {
  green: { c: "#58CC02", lip: "#46A302", text: "#fff" },
  blue: { c: "#1CB0F6", lip: "#1899D6", text: "#fff" },
  red: { c: "#FF4B4B", lip: "#E63E3E", text: "#fff" },
  yellow: { c: "#FFC800", lip: "#E6AD00", text: "#3C3C3C" },
  purple: { c: "#CE82FF", lip: "#A568CC", text: "#fff" },
  gray: { c: "#2A2A35", lip: "#1A1A22", text: "#AAA" },
};

const rid = () => Math.random().toString(36).slice(2, 10);
const code5 = () => String(Math.floor(10000 + Math.random() * 90000));
function getUserId() {
  let id = localStorage.getItem("rp_uid");
  if (!id) {
    id = rid();
    localStorage.setItem("rp_uid", id);
  }
  return id;
}
function loadSession() {
  try {
    const s = JSON.parse(localStorage.getItem("rp_session") || "null");
    return s?.code ? s : null;
  } catch {
    return null;
  }
}
function saveSession(code, watchingVideoId) {
  if (!code) {
    localStorage.removeItem("rp_session");
    return;
  }
  const prev = loadSession();
  const payload = { code };
  const nextWatching =
    watchingVideoId !== undefined
      ? watchingVideoId
      : prev?.code === code
        ? prev?.watchingVideoId
        : undefined;
  if (nextWatching) payload.watchingVideoId = nextWatching;
  localStorage.setItem("rp_session", JSON.stringify(payload));
}

function readClipboardViaExecCommand(inputEl) {
  if (!inputEl) return "";
  inputEl.value = "";
  inputEl.focus({ preventScroll: true });
  let pasted = "";
  try {
    if (document.execCommand("paste")) pasted = inputEl.value.trim();
  } catch {}
  inputEl.blur();
  return pasted;
}

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

function extractLinkFromText(text) {
  if (!text) return "";
  const match = text.match(/https?:\/\/[^\s<>"']+/);
  return match ? match[0].replace(/[.,)]+$/, "") : text.trim();
}

function normalizeClipboardText(raw) {
  const trimmed = (raw || "").trim();
  if (!trimmed) return "";
  return extractLinkFromText(trimmed) || trimmed;
}

function detectPlatform(raw) {
  if (!raw) return null;
  const url = raw.trim();
  const yt = url.match(
    /(?:youtube\.com\/(?:shorts\/|watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/,
  );
  if (yt) return { platform: "youtube", videoId: yt[1], url };
  const tt = url.match(/\/video\/(\d+)/);
  if (/tiktok\.com/.test(url))
    return { platform: "tiktok", videoId: tt?.[1] || null, url };
  const ig = url.match(/instagram\.com\/(?:reel|reels|p)\/([A-Za-z0-9_-]+)/);
  if (ig) return { platform: "instagram", videoId: ig[1], url };
  return null;
}

const PENDING_SHARE_KEY = "rp_pending_share";

function partyJoinUrl(code) {
  return `${window.location.origin}/join/${encodeURIComponent(code)}`;
}

function parseJoinCodeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("join");
  if (fromQuery && /^\d{5}$/.test(fromQuery.trim())) return fromQuery.trim();
  const pathMatch = window.location.pathname.match(/\/join\/(\d{5})\/?$/);
  if (pathMatch) return pathMatch[1];
  return null;
}

function clearJoinFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("join");
  if (/\/join\/\d{5}\/?$/.test(url.pathname)) url.pathname = "/";
  window.history.replaceState({}, "", `${url.pathname}${url.search}`);
}

function captureSharedLink() {
  const params = new URLSearchParams(window.location.search);
  const raw =
    params.get("url") || params.get("text") || params.get("title") || "";
  if (!raw) return;
  const link = extractLinkFromText(decodeURIComponent(raw));
  if (detectPlatform(link)) {
    sessionStorage.setItem(PENDING_SHARE_KEY, link);
    window.history.replaceState({}, "", window.location.pathname);
  }
}

captureSharedLink();
const openVideoLink = (url) => {
  window.open(url, "_blank", "noopener,noreferrer");
};
const ytThumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
const platLabel = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
};
const platChipStyle = {
  youtube: { background: "#FF0000", color: "#fff" },
  tiktok: { background: "#000", color: "#fff" },
  instagram: {
    background: "linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf)",
    color: "#fff",
  },
};
const defaultTitle = (p) =>
  p === "tiktok"
    ? "TikTok video"
    : p === "instagram"
      ? "Instagram Reel"
      : "YouTube Short";
const REACTIONS = ["🔥", "😂", "❤️", "😮", "🥹", "💀"];
const CUSTOM_EMOJIS = [
  "😀",
  "🤣",
  "😭",
  "🥰",
  "😘",
  "😱",
  "🤯",
  "😤",
  "😎",
  "🥳",
  "👀",
  "💔",
  "👏",
  "🙏",
  "💯",
  "✨",
  "🎉",
  "👑",
  "💩",
  "🤡",
  "😈",
  "🫡",
  "🤷",
  "💪",
  "🍿",
  "🫶",
  "👎",
  "💙",
  "☠️",
  "🦄",
  "🤔",
  "😬",
  "🫠",
  "🤪",
  "😡",
  "🥺",
  "💅",
  "🙄",
  "😴",
  "🤝",
  "👊",
  "🫨",
  "🤌",
  "🎯",
  "⚡",
  "🌶️",
  "😳",
  "🙌",
  "🗿",
  "🥶",
];

function isPresetReaction(reaction) {
  return REACTIONS.includes(reaction);
}

function reactionSummary(reactions) {
  const counts = {};
  Object.values(reactions || {}).forEach((emoji) => {
    counts[emoji] = (counts[emoji] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function reactionCount(reactions) {
  return Object.keys(reactions || {}).length;
}

const QUEUE_SORTS = [
  { id: "added", label: "Queue" },
  { id: "platform", label: "Platform" },
  { id: "reaction", label: "Reaction" },
  { id: "views", label: "Most Views" },
];

function sortQueue(items, sortBy) {
  if (!items?.length || sortBy === "added") return items;
  const indexed = items.map((v, i) => ({ v, i }));
  indexed.sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case "platform":
        cmp = (platLabel[a.v.platform] || a.v.platform).localeCompare(
          platLabel[b.v.platform] || b.v.platform,
        );
        break;
      case "reaction":
        cmp = reactionCount(b.v.reactions) - reactionCount(a.v.reactions);
        break;
      case "views":
        cmp = (b.v.watchCount || 0) - (a.v.watchCount || 0);
        break;
    }
    return cmp || a.i - b.i;
  });
  return indexed.map(({ v }) => v);
}

function queueAdders(party) {
  if (!party?.queue?.length) return [];
  const seen = new Set();
  const adders = [];
  for (const v of party.queue) {
    if (seen.has(v.addedById)) continue;
    seen.add(v.addedById);
    adders.push(resolveMember(party, v.addedById, v));
  }
  return adders.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
}

function sortMembersForDisplay(members, userId, hostId) {
  const byJoinOrder = (a, b) => (a.joinedAt || "").localeCompare(b.joinedAt || "");
  const meMember = members.find((m) => m.id === userId);
  const hostMember = members.find((m) => m.id === hostId);
  const rest = members
    .filter((m) => m.id !== userId && m.id !== hostId)
    .sort(byJoinOrder);
  return [
    ...(meMember ? [meMember] : []),
    ...(hostMember && hostMember.id !== userId ? [hostMember] : []),
    ...rest,
  ];
}

function resolveMember(party, memberId, video) {
  const member = party?.members.find((m) => m.id === memberId);
  if (member) return { ...member, booted: false };
  const name =
    (video?.addedById === memberId ? video.addedByName : null) ||
    party?.queue.find((q) => q.addedById === memberId)?.addedByName ||
    "Guest";
  return { id: memberId, name, color: avatarColorFor(memberId), booted: true };
}

function memberLabel({ name, booted }) {
  return booted ? `${name} (booted)` : name;
}

function hasActivity(video) {
  return (
    (video.watchCount || 0) > 0 || Object.keys(video.reactions || {}).length > 0
  );
}

function PlatformLogo({ platform, size = 16 }) {
  const s = { width: size, height: size, display: "block", flexShrink: 0 };
  if (platform === "youtube") {
    return (
      <svg style={s} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  }
  if (platform === "tiktok") {
    return (
      <svg style={s} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
      </svg>
    );
  }
  return (
    <svg style={s} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}
function PlatformBadge({ platform }) {
  return (
    <span
      className="rp-platform-badge"
      style={platChipStyle[platform]}
      aria-label={platLabel[platform]}
    >
      <PlatformLogo platform={platform} size={15} />
    </span>
  );
}
function ReactionChips({ reactions, onClick }) {
  const summary = reactionSummary(reactions);
  if (!summary.length) return null;
  return (
    <div
      className="rp-reaction-chips"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick(e) : undefined}
    >
      {summary.map(([emoji, count]) => (
        <span key={emoji} className="rp-reaction-chip">
          {emoji}
          <span>{count}</span>
        </span>
      ))}
    </div>
  );
}
function ReactionFan({ x, y, value, onPick, onClose }) {
  const [customOpen, setCustomOpen] = useState(false);
  const radius = 76;
  const customValue = value && !isPresetReaction(value) ? value : null;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="rp-reaction-fan-backdrop" onClick={onClose}>
      <div
        className={`rp-reaction-fan${customOpen ? " rp-reaction-fan--custom-open" : ""}`}
        style={{ left: x, top: y }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Pick a reaction"
      >
        <div className="rp-reaction-fan-ring" aria-hidden />
        {customOpen && (
          <>
            <div className="rp-reaction-fan-custom-picker" role="listbox">
              {CUSTOM_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  role="option"
                  className={`rp-reaction-fan-custom-emoji${customValue === emoji ? " rp-reaction-fan-custom-emoji--on" : ""}`}
                  aria-label={`React ${emoji}`}
                  aria-selected={customValue === emoji}
                  onClick={() => onPick(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="rp-reaction-fan-picker-close"
              onClick={() => setCustomOpen(false)}
              aria-label="Close emoji picker"
            >
              <X size={18} strokeWidth={2.5} aria-hidden />
            </button>
          </>
        )}
        {!customOpen && (
          <button
            type="button"
            className={`rp-reaction-fan-center rp-reaction-fan-center--custom${customValue ? " rp-reaction-fan-center--on" : ""}`}
            onClick={() => setCustomOpen(true)}
            aria-label="Pick custom emoji"
            aria-expanded={false}
          >
            {customValue ? (
              <span className="rp-reaction-fan-center-emoji">{customValue}</span>
            ) : (
              <Plus size={22} strokeWidth={2.5} aria-hidden />
            )}
          </button>
        )}
        {!customOpen &&
          REACTIONS.map((emoji, i) => {
            const angle = (2 * Math.PI * i) / REACTIONS.length - Math.PI / 2;
            const tx = Math.cos(angle) * radius;
            const ty = Math.sin(angle) * radius;
            return (
              <button
                key={emoji}
                type="button"
                className={`rp-reaction-fan-item${value === emoji ? " rp-reaction-fan-item--on" : ""}`}
                style={{ "--tx": `${tx}px`, "--ty": `${ty}px`, "--i": i }}
                onClick={() => onPick(emoji)}
                aria-label={`React ${emoji}`}
              >
                {emoji}
              </button>
            );
          })}
      </div>
    </div>
  );
}
const EXPLOSION_PARTICLES = 14;
const REACTION_BURST_MS = 4200;

function ReactionBurst({ burstId, emoji, name, color, userId, onDone }) {
  const particles = useRef(
    Array.from({ length: EXPLOSION_PARTICLES }, (_, i) => {
      const angle =
        (360 / EXPLOSION_PARTICLES) * i + (Math.random() - 0.5) * 22;
      const dist = 42 + Math.random() * 62;
      const delay = Math.random() * 0.1;
      const scale = 0.75 + Math.random() * 0.5;
      return { id: i, angle, dist, delay, scale };
    }),
  ).current;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const t = setTimeout(() => onDoneRef.current(), REACTION_BURST_MS);
    return () => clearTimeout(t);
  }, [burstId]);

  return (
    <div className="rp-reaction-explosion" aria-hidden>
      <div className="rp-reaction-explosion-flash" />
      <div className="rp-reaction-identity">
        <Avatar id={userId} name={name} />
        <span className="rp-reaction-identity-name">{name}</span>
      </div>
      {particles.map((p) => (
        <div
          key={p.id}
          className="rp-reaction-particle rp-reaction-particle--emoji"
          style={{
            "--angle": `${p.angle}deg`,
            "--dist": `${p.dist}px`,
            "--delay": `${p.delay}s`,
            "--scale": p.scale,
          }}
        >
          {emoji}
        </div>
      ))}
    </div>
  );
}

async function fetchMeta({ platform, videoId, url }) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch("/api/meta?url=" + encodeURIComponent(url), {
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (res.ok) {
      const d = await res.json();
      return {
        title: d.title || defaultTitle(platform),
        creator: d.creator || "",
        thumbnail:
          d.thumbnail ||
          (platform === "youtube" && videoId ? ytThumb(videoId) : ""),
      };
    }
  } catch (e) {}
  return {
    title: defaultTitle(platform),
    creator: "",
    thumbnail: platform === "youtube" && videoId ? ytThumb(videoId) : "",
  };
}

function Btn({
  children,
  tone = "green",
  onClick,
  onPointerDown,
  onTouchStart,
  full,
  disabled,
  sm,
  style,
}) {
  const p = PAL[tone];
  return (
    <button
      className="rp-btn"
      onClick={onClick}
      onPointerDown={onPointerDown}
      onTouchStart={onTouchStart}
      disabled={disabled}
      style={{
        "--c": p.c,
        "--lip": p.lip,
        color: p.text,
        width: full ? "100%" : undefined,
        padding: sm ? "8px 16px" : "14px 22px",
        fontSize: sm ? 15 : 17,
        opacity: disabled ? 0.45 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}
function Confetti({ go }) {
  if (!go) return null;
  const cols = [
    "#58CC02",
    "#1CB0F6",
    "#FF4B4B",
    "#FFC800",
    "#CE82FF",
    "#FF9600",
  ];
  return (
    <div className="rp-confetti">
      {Array.from({ length: 70 }).map((_, i) => (
        <span
          key={i}
          style={{
            left: Math.random() * 100 + "%",
            background: cols[i % cols.length],
            animationDelay: Math.random() * 0.4 + "s",
            animationDuration: 1.2 + Math.random() + "s",
            width: 7 + Math.random() * 7,
            height: 9 + Math.random() * 9,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          }}
        />
      ))}
    </div>
  );
}

function WelcomeLockup() {
  return (
    <div className="rp-welcome-lockup">
      <div className="rp-welcome-mark-wrap">
        <div className="rp-welcome-mark-glow" aria-hidden />
        <div className="rp-welcome-mark">
          <span className="rp-welcome-mark-emoji" aria-hidden>🎬</span>
        </div>
        <div className="rp-welcome-spark rp-welcome-spark--1" aria-hidden>✦</div>
        <div className="rp-welcome-spark rp-welcome-spark--2" aria-hidden>✦</div>
      </div>
      <h1 className="rp-welcome-title rp-head">
        <span className="rp-welcome-title-reel">Reel</span>
        <span className="rp-welcome-title-party">Party</span>
      </h1>
      <div className="rp-welcome-strip" aria-hidden>
        <span /><span /><span /><span /><span /><span /><span /><span />
      </div>
      <p className="rp-welcome-tagline rp-muted">
        Watch short videos together.
        <br />
        Build the queue with your crew. <span className="rp-welcome-popcorn">🍿</span>
      </p>
      <div className="rp-welcome-platforms" aria-label="Supports TikTok, YouTube, and Instagram">
        {(["tiktok", "youtube", "instagram"]).map((p) => (
          <span key={p} className="rp-welcome-platform" style={platChipStyle[p]}>
            <PlatformLogo platform={p} size={13} />
            {platLabel[p]}
          </span>
        ))}
      </div>
    </div>
  );
}

function BackBar({ onBack }) {
  return (
    <button
      onClick={onBack}
      className="rp-btn"
      style={{
        "--c": "var(--rp-btn-ghost)",
        "--lip": "var(--rp-btn-ghost-lip)",
        color: "var(--rp-text-2)",
        padding: 9,
        borderRadius: 12,
        alignSelf: "flex-start",
      }}
    >
      <ArrowLeft size={18} />
    </button>
  );
}
function Thumb({ v }) {
  const [err, setErr] = useState(false);
  if (v.thumbnail && !err)
    return (
      <img
        src={v.thumbnail}
        alt=""
        onError={() => setErr(true)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...platChipStyle[v.platform],
      }}
    >
      <PlatformLogo platform={v.platform} size={32} />
    </div>
  );
}
function Sheet({ children, onClose, panelRef, panelClassName = "" }) {
  return (
    <div
      onClick={onClose}
      className="rp-sheet-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--rp-overlay)",
        zIndex: 75,
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className={`rp-sheet-panel ${panelClassName}`.trim()}
      >
        <div className="rp-sheet-handle" />
        {children}
      </div>
    </div>
  );
}
export default function App() {
  const meRef = useRef(getUserId());
  const me = meRef.current;
  const pastePanelRef = useRef(null);
  const pasteInputRef = useRef(null);
  const hiddenPasteRef = useRef(null);
  const mySpotRef = useRef(null);
  const [myWatchingId, setMyWatchingId] = useState(() => {
    const s = loadSession();
    return s?.watchingVideoId || null;
  });
  const [screen, setScreen] = useState("home");
  const [party, setParty] = useState(null);
  const [code, setCode] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinErr, setJoinErr] = useState("");
  const [confetti, setConfetti] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addMsg, setAddMsg] = useState("");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteVal, setPasteVal] = useState("");
  const [pasteBusy, setPasteBusy] = useState(false);
  const [viewersVideo, setViewersVideo] = useState(null);
  const [reactionFan, setReactionFan] = useState(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const [joinViaLink, setJoinViaLink] = useState(false);
  const [unwatchConfirm, setUnwatchConfirm] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [ready, setReady] = useState(false);
  const [activeReactionBursts, setActiveReactionBursts] = useState({});
  const [queueSort, setQueueSort] = useState("added");
  const [hideWatched, setHideWatched] = useState(() => {
    try {
      return localStorage.getItem("rp_hide_watched") === "1";
    } catch {
      return false;
    }
  });
  const [filterUserId, setFilterUserId] = useState(null);
  const burstIdRef = useRef(0);
  const prevReactionsRef = useRef({});
  const reactionsInitRef = useRef(false);
  const localReactionAtRef = useRef({});
  const clipboardReadRef = useRef(null);
  const pendingShareHandledRef = useRef(false);

  const isHost = party?.hostId === me;
  const fireConfetti = () => {
    setConfetti(true);
    setTimeout(() => setConfetti(false), 2200);
  };
  const showToast = (m) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  };

  const completeReactionBurst = useCallback((videoId, burstId) => {
    setActiveReactionBursts((active) => {
      if (active[videoId]?.id !== burstId) return active;
      const updated = { ...active };
      delete updated[videoId];
      return updated;
    });
  }, []);

  const spawnReactionBurst = useCallback((videoId, emoji, member) => {
    if (!member || !emoji) return;
    const burst = {
      id: ++burstIdRef.current,
      at: Date.now(),
      videoId,
      emoji,
      name: member.name,
      color: member.color,
      userId: member.id,
    };
    setActiveReactionBursts((active) => ({ ...active, [videoId]: burst }));
  }, []);

  const syncPrevReaction = useCallback((videoId, userId, emoji) => {
    if (!prevReactionsRef.current[videoId])
      prevReactionsRef.current[videoId] = {};
    if (emoji) prevReactionsRef.current[videoId][userId] = emoji;
    else delete prevReactionsRef.current[videoId][userId];
  }, []);

  const startClipboardRead = useCallback(() => {
    if (clipboardReadRef.current) return;
    try {
      if (navigator.clipboard?.readText) {
        clipboardReadRef.current = navigator.clipboard.readText();
      }
    } catch {}
  }, []);

  const readClipboardNow = useCallback(async (hiddenEl) => {
    if (!clipboardReadRef.current) {
      startClipboardRead();
    }
    let fromApi = "";
    try {
      if (clipboardReadRef.current) fromApi = await clipboardReadRef.current;
    } catch {}
    clipboardReadRef.current = null;
    const trimmed = normalizeClipboardText(fromApi);
    if (trimmed) return trimmed;
    if (!isIOS()) return normalizeClipboardText(readClipboardViaExecCommand(hiddenEl));
    return "";
  }, [startClipboardRead]);

  const applyClipboardToPaste = useCallback(async (hiddenEl) => {
    const text = await readClipboardNow(hiddenEl);
    if (!text) return "";
    setPasteVal(text);
    return text;
  }, [readClipboardNow]);

  const focusPasteInput = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const input = pasteInputRef.current;
        if (!input) return;
        input.focus({ preventScroll: true });
        const len = input.value.length;
        input.setSelectionRange(len, len);
      });
    });
  }, []);

  useEffect(() => {
    const joinCodeFromUrl = parseJoinCodeFromUrl();
    const session = loadSession();

    const finish = () => setReady(true);

    const openJoinName = (c) => {
      setCode(c);
      setJoinCode(c);
      setJoinViaLink(true);
      setScreen("joinName");
      clearJoinFromUrl();
      finish();
    };

    const restoreParty = (c, watchingVideoId) => {
      setCode(c);
      setScreen("party");
      if (watchingVideoId) setMyWatchingId(watchingVideoId);
      clearJoinFromUrl();
      finish();
    };

    if (joinCodeFromUrl) {
      api
        .getParty(joinCodeFromUrl)
        .then(async (p) => {
          if (!p) {
            clearJoinFromUrl();
            finish();
            setTimeout(
              () => showToast("That invite link isn't valid anymore"),
              0,
            );
            return;
          }
          if (session?.code === joinCodeFromUrl) {
            try {
              const mem = await api.getMembers(joinCodeFromUrl);
              if (mem.some((m) => m.id === me)) {
                restoreParty(joinCodeFromUrl, session.watchingVideoId);
                return;
              }
            } catch {}
          }
          openJoinName(joinCodeFromUrl);
        })
        .catch(() => {
          clearJoinFromUrl();
          finish();
        });
      return;
    }

    if (!session) {
      finish();
      return;
    }
    api
      .getParty(session.code)
      .then((p) => {
        if (p) {
          setCode(session.code);
          setScreen("party");
          if (session.watchingVideoId) setMyWatchingId(session.watchingVideoId);
        } else saveSession(null);
        finish();
      })
      .catch(() => {
        saveSession(null);
        finish();
      });
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (screen === "party" && code) {
      saveSession(code, myWatchingId ?? undefined);
    } else if (screen === "home") {
      saveSession(null);
      setMyWatchingId(null);
    }
  }, [screen, code, ready, myWatchingId]);

  useEffect(() => {
    try {
      localStorage.setItem("rp_hide_watched", hideWatched ? "1" : "0");
    } catch {}
  }, [hideWatched]);

  useEffect(() => {
    if (!party?.queue || !myWatchingId) return;
    if (!party.queue.some((v) => v.id === myWatchingId)) {
      setMyWatchingId(null);
      saveSession(code, null);
    }
  }, [party?.queue, myWatchingId, code]);

  useEffect(() => {
    const scrollToSpot = () => {
      if (document.visibilityState === "visible" && myWatchingId) {
        mySpotRef.current?.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    };
    document.addEventListener("visibilitychange", scrollToSpot);
    return () => document.removeEventListener("visibilitychange", scrollToSpot);
  }, [myWatchingId]);

  useEffect(() => {
    if (!code || screen !== "party") return;
    let alive = true;
    const refresh = async () => {
      const [p, mem, q] = await Promise.all([
        api.getParty(code),
        api.getMembers(code),
        api.getQueue(code),
      ]);
      if (!alive) return;
      if (!p || !mem.some((m) => m.id === me)) {
        saveSession(null);
        setScreen("home");
        setParty(null);
        setCode("");
        if (p && !mem.some((m) => m.id === me))
          showToast("You were removed from the party");
        return;
      }
      setParty({ ...p, members: mem, queue: q });
    };
    refresh();
    const poll = setInterval(refresh, 2000);
    return () => {
      alive = false;
      clearInterval(poll);
    };
  }, [code, screen]);

  useEffect(() => {
    if (screen !== "party") {
      reactionsInitRef.current = false;
      prevReactionsRef.current = {};
      setActiveReactionBursts({});
    }
  }, [screen]);

  useEffect(() => {
    if (!party?.queue || !party.members) return;

    if (!reactionsInitRef.current) {
      prevReactionsRef.current = Object.fromEntries(
        party.queue.map((v) => [v.id, { ...(v.reactions || {}) }]),
      );
      reactionsInitRef.current = true;
      return;
    }

    party.queue.forEach((v) => {
      const prev = prevReactionsRef.current[v.id] || {};
      const curr = v.reactions || {};
      Object.entries(curr).forEach(([userId, emoji]) => {
        if (prev[userId] === emoji) return;
        const key = `${v.id}:${userId}`;
        if (
          userId === me &&
          Date.now() - (localReactionAtRef.current[key] || 0) < 500
        )
          return;
        const member = party.members.find((m) => m.id === userId);
        if (member) spawnReactionBurst(v.id, emoji, member);
      });
    });

    prevReactionsRef.current = Object.fromEntries(
      party.queue.map((v) => [v.id, { ...(v.reactions || {}) }]),
    );
  }, [party?.queue, party?.members, me, spawnReactionBurst]);

  useEffect(() => {
    if (!pasteOpen) return;

    const panel = pastePanelRef.current;
    const lift = () => {
      const vv = window.visualViewport;
      if (!panel || !vv) return;
      const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      panel.style.transform = kb > 0 ? `translateY(-${kb}px)` : "";
    };
    window.visualViewport?.addEventListener("resize", lift);
    window.visualViewport?.addEventListener("scroll", lift);
    lift();

    if (!pasteBusy) focusPasteInput();

    return () => {
      window.visualViewport?.removeEventListener("resize", lift);
      window.visualViewport?.removeEventListener("scroll", lift);
      if (panel) panel.style.transform = "";
    };
  }, [pasteOpen, pasteBusy, focusPasteInput]);

  const createParty = async () => {
    const nm = nameInput.trim() || "Host";
    let c = code5();
    for (let i = 0; i < 5; i++) {
      if (!(await api.getParty(c))) break;
      c = code5();
    }
    await api.createParty(c, me, nm);
    setCode(c);
    setScreen("party");
    fireConfetti();
  };
  const doJoin = async () => {
    setJoinErr("");
    const c = joinCode.trim();
    if (c.length !== 5) {
      setJoinErr("Enter the 5-digit code");
      return;
    }
    const p = await api.getParty(c);
    if (!p) {
      setJoinErr("No party found with that code 🤔");
      return;
    }
    setJoinViaLink(false);
    setCode(c);
    setScreen("joinName");
  };
  const confirmJoinName = async () => {
    await api.joinParty(code, me, nameInput.trim() || "Guest");
    setJoinViaLink(false);
    setScreen("party");
    fireConfetti();
  };
  const sharePartyInvite = () => {
    if (!party?.code) return;
    if (typeof navigator.share === "function") {
      setInviteOpen(true);
      return;
    }
    void copyInviteLink();
  };
  const copyInviteLink = async () => {
    if (!party?.code) return;
    const link = partyJoinUrl(party.code);
    try {
      await navigator.clipboard.writeText(link);
      showToast("Invite link copied! 📋");
      setInviteOpen(false);
    } catch {
      showToast("Couldn't copy invite link");
    }
  };
  const shareInviteMessage = async () => {
    if (!party?.code) return;
    const link = partyJoinUrl(party.code);
    const hostName =
      party.members?.find((m) => m.id === party.hostId)?.name ||
      party.hostName ||
      "Someone";
    try {
      await navigator.share({
        title: `Join ${hostName}'s ReelParty 🎬`,
        text: `Party code ${party.code} — watch TikToks, Reels & Shorts together`,
        url: link,
      });
      setInviteOpen(false);
    } catch (err) {
      if (err?.name === "AbortError") return;
      showToast("Couldn't open share sheet");
    }
  };
  const ingestLink = async (raw) => {
    const text = normalizeClipboardText(raw);
    const det = detectPlatform(text);
    if (!det) {
      showToast("That's not a TikTok, Reels, or Shorts link 🙈");
      return;
    }
    setAdding(true);
    setAddMsg("Fetching video info…");
    const meta = await fetchMeta(det);
    const myName = party?.members.find((m) => m.id === me)?.name || "Someone";
    await api.addVideo({
      id: rid(),
      partyCode: code,
      ...det,
      ...meta,
      addedById: me,
      addedByName: myName,
      position: party?.queue.length || 0,
    });
    setAdding(false);
    setAddMsg("");
    setPasteOpen(false);
    setPasteVal("");
    fireConfetti();
    showToast(
      `Added "${meta.title.slice(0, 28)}${meta.title.length > 28 ? "…" : ""}"`,
    );
  };

  useEffect(() => {
    if (
      screen !== "party" ||
      !party ||
      adding ||
      pendingShareHandledRef.current
    )
      return;
    const pending = sessionStorage.getItem(PENDING_SHARE_KEY);
    if (!pending || !detectPlatform(pending)) return;
    pendingShareHandledRef.current = true;
    sessionStorage.removeItem(PENDING_SHARE_KEY);
    void ingestLink(pending);
  }, [screen, party, adding]);

  const tapAdd = () => {
    setPasteVal("");
    setPasteBusy(true);
    clipboardReadRef.current = null;
    startClipboardRead();

    void (async () => {
      const readPromise = readClipboardNow(hiddenPasteRef.current);
      const timeout = new Promise((resolve) => setTimeout(() => resolve(""), 12000));
      const text = await Promise.race([readPromise, timeout]);
      setPasteBusy(false);
      if (text && detectPlatform(text)) {
        void ingestLink(text);
        return;
      }
      setPasteOpen(true);
      if (text) setPasteVal(text);
      focusPasteInput();
    })();
  };

  const pasteFromClipboard = () => {
    clipboardReadRef.current = null;
    startClipboardRead();
    void (async () => {
      setPasteBusy(true);
      const text = await readClipboardNow(hiddenPasteRef.current);
      setPasteBusy(false);
      if (text) {
        setPasteVal(text);
        if (detectPlatform(text)) return;
      } else {
        showToast(isIOS() ? "Tap Allow Paste when prompted" : "Nothing to paste");
      }
      focusPasteInput();
    })();
  };
  const playVideo = async (vid) => {
    setMyWatchingId(vid.id);
    saveSession(code, vid.id);
    await api.playVideo(code, vid.id, me);
    openVideoLink(vid.url);
  };
  const removeVideo = async (vid) => {
    try {
      await api.removeVideo(code, vid.id, me);
      if (vid.id === myWatchingId) {
        setMyWatchingId(null);
        saveSession(code, null);
      }
      setDeleteConfirm(null);
      showToast("Removed from queue");
    } catch {
      showToast("Couldn't remove video");
    }
  };
  const confirmDelete = () => {
    const vid = deleteConfirm;
    if (!vid) return;
    removeVideo(vid);
  };
  const confirmUnwatch = async () => {
    const vid = unwatchConfirm;
    if (!vid) return;
    try {
      await api.unwatchVideo(code, vid.id, me);
      setParty((p) =>
        p
          ? {
              ...p,
              queue: p.queue.map((v) => {
                if (v.id !== vid.id) return v;
                const watchedBy = v.watchedBy.filter((id) => id !== me);
                const reactions = { ...(v.reactions || {}) };
                delete reactions[me];
                return {
                  ...v,
                  watchedBy,
                  watchCount: watchedBy.length,
                  reactions,
                };
              }),
            }
          : null,
      );
      setUnwatchConfirm(null);
      showToast("Marked unwatched");
    } catch {
      showToast("Couldn't update watch status");
    }
  };
  const kickMember = async (memberId) => {
    try {
      await api.removeMember(code, memberId, me);
      showToast("User removed");
    } catch {
      showToast("Couldn't remove user");
    }
  };
  const leave = () => {
    saveSession(null);
    setMyWatchingId(null);
    setMembersOpen(false);
    setScreen("home");
    setParty(null);
    setCode("");
    setNameInput("");
    setJoinCode("");
  };
  const activityFor = (video) => {
    const ids = new Set([
      ...(video.watchedBy || []),
      ...Object.keys(video.reactions || {}),
    ]);
    return [...ids]
      .map((id) => {
        const m = resolveMember(party, id, video);
        return {
          ...m,
          watched: video.watchedBy?.includes(id),
          reaction: video.reactions?.[id] || null,
        };
      })
      .sort(
        (a, b) =>
          Number(b.watched) - Number(a.watched) || a.name.localeCompare(b.name),
      );
  };
  const setReaction = async (vid, reaction) => {
    const prev = vid.reactions?.[me] || null;
    const removing = prev === reaction;
    const next = { ...(vid.reactions || {}) };
    if (removing) delete next[me];
    else next[me] = reaction;

    if (!removing) {
      localReactionAtRef.current[`${vid.id}:${me}`] = Date.now();
      syncPrevReaction(vid.id, me, reaction);
      const member = party?.members.find((m) => m.id === me);
      if (member) spawnReactionBurst(vid.id, reaction, member);
    } else {
      syncPrevReaction(vid.id, me, null);
    }

    setParty((p) =>
      p
        ? {
            ...p,
            queue: p.queue.map((v) =>
              v.id === vid.id ? { ...v, reactions: next } : v,
            ),
          }
        : null,
    );
    if (viewersVideo?.id === vid.id) {
      setViewersVideo((v) => (v ? { ...v, reactions: next } : null));
    }
    try {
      await api.reactToVideo(code, vid.id, me, reaction);
    } catch {
      setParty((p) =>
        p
          ? {
              ...p,
              queue: p.queue.map((v) =>
                v.id === vid.id ? { ...v, reactions: vid.reactions || {} } : v,
              ),
            }
          : null,
      );
      if (viewersVideo?.id === vid.id) setViewersVideo(vid);
      showToast("Couldn't save reaction");
    }
  };
  const mySpot = party?.queue.find((q) => q.id === myWatchingId);
  const nowPlaying = party?.queue.find((q) => q.id === party.nowPlayingId);
  const sortedMembers = party
    ? sortMembersForDisplay(party.members, me, party.hostId)
    : [];
  const adders = party ? queueAdders(party) : [];
  const filteredQueue = party
    ? party.queue.filter((v) => {
        if (hideWatched && v.watchedBy?.includes(me) && v.id !== myWatchingId) {
          return false;
        }
        if (filterUserId && v.addedById !== filterUserId) return false;
        return true;
      })
    : [];
  const displayedQueue = sortQueue(filteredQueue, queueSort);
  const filterUser = filterUserId
    ? adders.find((m) => m.id === filterUserId)
    : null;
  const hasActiveFilters = hideWatched || filterUserId;

  if (!ready) {
    return (
      <div
        className="rp-root"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <Loader2 size={40} color="#58CC02" className="rp-spin" />
      </div>
    );
  }

  return (
    <div className="rp-root">
      <Confetti go={confetti} />
      {toast && <div className="rp-toast">{toast}</div>}

      {screen === "home" && (
        <div className="rp-welcome">
          <WelcomeLockup />
          <div style={{ flex: 1 }} />
          <div className="rp-welcome-actions">
            <Btn
              tone="green"
              full
              onClick={() => {
                setNameInput("");
                setScreen("create");
              }}
            >
              <Sparkles size={20} /> CREATE A PARTY
            </Btn>
            <Btn
              tone="blue"
              full
              onClick={() => {
                setJoinCode("");
                setJoinErr("");
                setScreen("join");
              }}
            >
              <Users size={20} /> JOIN A PARTY
            </Btn>
          </div>
        </div>
      )}

      {screen === "create" && (
        <div
          className="rp-rise"
          style={{
            minHeight: "84vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <BackBar onBack={() => setScreen("home")} />
          <div style={{ textAlign: "center", marginTop: 30 }}>
            <div className="rp-pop" style={{ fontSize: 56 }}>
              👑
            </div>
            <h2
              className="rp-head"
              style={{ fontSize: 26, color: "#58CC02", margin: "8px 0 4px" }}
            >
              You're the host!
            </h2>
            <p className="rp-muted" style={{ fontWeight: 700 }}>
              What should we call you?
            </p>
          </div>
          <input
            className="rp-input"
            placeholder="Your name"
            maxLength={16}
            value={nameInput}
            style={{ marginTop: 24 }}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createParty()}
            autoFocus
          />
          <div style={{ flex: 1 }} />
          <Btn
            tone="green"
            full
            disabled={!nameInput.trim()}
            onClick={createParty}
            style={{ marginBottom: 20 }}
          >
            LET'S GO 🚀
          </Btn>
        </div>
      )}

      {screen === "join" && (
        <div
          className="rp-rise"
          style={{
            minHeight: "84vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <BackBar onBack={() => setScreen("home")} />
          <div style={{ textAlign: "center", marginTop: 30 }}>
            <div className="rp-pop" style={{ fontSize: 56 }}>
              🎟️
            </div>
            <h2
              className="rp-head"
              style={{ fontSize: 26, color: "#1CB0F6", margin: "8px 0 4px" }}
            >
              Join the party
            </h2>
            <p className="rp-muted" style={{ fontWeight: 700 }}>
              Enter the 5-digit code
            </p>
          </div>
          <input
            className="rp-digit"
            inputMode="numeric"
            placeholder="—————"
            maxLength={5}
            value={joinCode}
            style={{ marginTop: 24 }}
            onChange={(e) => {
              setJoinCode(e.target.value.replace(/\D/g, ""));
              setJoinErr("");
            }}
            onKeyDown={(e) => e.key === "Enter" && doJoin()}
            autoFocus
          />
          {joinErr && (
            <p
              style={{
                color: "#FF4B4B",
                fontWeight: 800,
                textAlign: "center",
                marginTop: 12,
              }}
            >
              {joinErr}
            </p>
          )}
          <div style={{ flex: 1 }} />
          <Btn
            tone="blue"
            full
            disabled={joinCode.length !== 5}
            onClick={doJoin}
            style={{ marginBottom: 20 }}
          >
            CONTINUE
          </Btn>
        </div>
      )}

      {screen === "joinName" && (
        <div
          className="rp-rise"
          style={{
            minHeight: "84vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <BackBar
            onBack={() => {
              setJoinViaLink(false);
              setScreen(joinViaLink ? "home" : "join");
            }}
          />
          <div style={{ textAlign: "center", marginTop: 30 }}>
            <div className="rp-pop" style={{ fontSize: 56 }}>
              🙋
            </div>
            <h2
              className="rp-head"
              style={{ fontSize: 26, color: "#1CB0F6", margin: "8px 0 4px" }}
            >
              Almost in!
            </h2>
            <p className="rp-muted" style={{ fontWeight: 700 }}>
              What's your name?
            </p>
            {code && (
              <p
                className="rp-subtle"
                style={{ fontWeight: 800, fontSize: 12, marginTop: 6 }}
              >
                Party code {code}
              </p>
            )}
          </div>
          <input
            className="rp-input"
            placeholder="Your name"
            maxLength={16}
            value={nameInput}
            style={{ marginTop: 24 }}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmJoinName()}
            autoFocus
          />
          <div style={{ flex: 1 }} />
          <Btn
            tone="green"
            full
            disabled={!nameInput.trim()}
            onClick={confirmJoinName}
            style={{ marginBottom: 20 }}
          >
            JOIN PARTY 🎉
          </Btn>
        </div>
      )}

      {screen === "party" && !party && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "84vh",
          }}
        >
          <Loader2 size={40} color="#58CC02" className="rp-spin" />
        </div>
      )}

      {screen === "party" && party && (
        <div
          style={{
            minHeight: "84vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <button
              onClick={leave}
              className="rp-btn"
              style={{
                "--c": "var(--rp-btn-ghost)",
                "--lip": "var(--rp-btn-ghost-lip)",
                color: "var(--rp-text-2)",
                padding: 9,
                borderRadius: 12,
              }}
            >
              <Home size={18} />
            </button>
            <button
              type="button"
              className="rp-card rp-codebox"
              onClick={sharePartyInvite}
              aria-label={`Share invite link for party ${party.code}`}
            >
              <Share2 size={16} color="var(--rp-accent-blue)" />
              <span className="rp-codebox-code">{party.code}</span>
              <span className="rp-codebox-hint">Invite</span>
            </button>
            <button
              onClick={() =>
                nowPlaying
                  ? playVideo(nowPlaying)
                  : showToast("Nothing playing in the party yet")
              }
              className="rp-btn"
              aria-label="Open party spot"
              style={{
                "--c": "#CE82FF",
                "--lip": "#A568CC",
                color: "#fff",
                padding: 9,
                borderRadius: 12,
              }}
            >
              <Tv size={18} />
            </button>
          </div>

          <div className="rp-members">
            <button
              type="button"
              className="rp-members-toggle"
              onClick={() => setMembersOpen((open) => !open)}
              aria-expanded={membersOpen}
            >
              <Users size={16} />
              <span>
                {party.members.length}{" "}
                {party.members.length === 1 ? "person" : "in party"}
              </span>
              <ChevronDown
                size={16}
                className={`rp-members-chevron${membersOpen ? " rp-members-chevron--open" : ""}`}
              />
            </button>
            {membersOpen && (
              <div className="rp-members-list">
                {sortedMembers.map((m) => (
                  <div key={m.id} className="rp-member-chip">
                    <Avatar id={m.id} name={m.name} sm />
                    <span style={{ fontWeight: 800, fontSize: 13 }}>
                      {m.name}
                    </span>
                    {m.id === party.hostId && (
                      <Crown size={13} color="#FFC800" fill="#FFC800" />
                    )}
                    {isHost && m.id !== party.hostId && (
                      <button
                        onClick={() => kickMember(m.id)}
                        aria-label={`Remove ${m.name}`}
                        style={{
                          display: "flex",
                          padding: 2,
                          marginLeft: 2,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--rp-text-3)",
                          lineHeight: 0,
                        }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {mySpot && (
            <div
              className="rp-card rp-pop rp-your-spot-banner"
              onClick={() => playVideo(mySpot)}
              style={{
                marginTop: 14,
                padding: 10,
                display: "flex",
                gap: 10,
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <div className="rp-your-spot-banner-thumb">
                <Thumb v={mySpot} />
                <div className="rp-your-spot-shade" aria-hidden="true" />
                <div className="rp-your-spot-banner-icon">
                  <Bookmark size={18} color="#fff" fill="#fff" />
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "var(--rp-accent-blue)",
                  }}
                >
                  YOUR SPOT · TAP TO REOPEN
                </div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 14,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {mySpot.title}
                </div>
              </div>
            </div>
          )}

          {nowPlaying && nowPlaying.id !== myWatchingId && (
            <div
              className="rp-card rp-pop"
              onClick={() => playVideo(nowPlaying)}
              style={{
                marginTop: mySpot ? 10 : 14,
                padding: 10,
                display: "flex",
                gap: 10,
                alignItems: "center",
                cursor: "pointer",
                borderColor: "var(--rp-accent-purple)",
                background: "var(--rp-now-playing)",
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  overflow: "hidden",
                  flexShrink: 0,
                  position: "relative",
                }}
              >
                <Thumb v={nowPlaying} />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(0,0,0,.25)",
                  }}
                >
                  <Play size={18} color="#fff" fill="#fff" />
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "var(--rp-accent-purple)",
                  }}
                >
                  PARTY IS ON · TAP TO OPEN
                </div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 14,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {nowPlaying.title}
                </div>
              </div>
            </div>
          )}

          <div
            className="rp-scroll"
            style={{ flex: 1, marginTop: 16, marginRight: -6, paddingRight: 6 }}
          >
            <div className="rp-queue-header">
              <div className="rp-queue-header-top">
                <h3 className="rp-head" style={{ fontSize: 18 }}>
                  The Queue
                </h3>
                <span
                  className="rp-subtle"
                  style={{ fontWeight: 800, fontSize: 13 }}
                >
                  {hasActiveFilters && displayedQueue.length < party.queue.length
                    ? `${displayedQueue.length} of ${party.queue.length} videos`
                    : `${party.queue.length} video${party.queue.length !== 1 ? "s" : ""}`}
                </span>
              </div>
              {party.queue.length > 0 && (
                <div
                  className="rp-queue-filters"
                  role="group"
                  aria-label="Filter queue"
                >
                  <span className="rp-queue-sort-label">
                    <Filter size={14} aria-hidden />
                    Filter
                  </span>
                  <div className="rp-queue-filter-pills">
                    <button
                      type="button"
                      className={`rp-queue-filter-pill${hideWatched ? " rp-queue-filter-pill--on" : ""}`}
                      onClick={() => setHideWatched((on) => !on)}
                      aria-pressed={hideWatched}
                    >
                      {hideWatched ? (
                        <EyeOff size={14} aria-hidden />
                      ) : (
                        <Eye size={14} aria-hidden />
                      )}
                      Hide watched
                    </button>
                    {adders.length > 1 &&
                      adders.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          className={`rp-queue-filter-pill rp-queue-filter-pill--user${filterUserId === m.id ? " rp-queue-filter-pill--on" : ""}`}
                          onClick={() =>
                            setFilterUserId((id) => (id === m.id ? null : m.id))
                          }
                          aria-pressed={filterUserId === m.id}
                        >
                          <Avatar id={m.id} name={m.name} sm />
                          {m.id === me ? "You" : m.name}
                        </button>
                      ))}
                  </div>
                </div>
              )}
              {party.queue.length > 1 && (
                <div className="rp-queue-sort" role="group" aria-label="Sort queue">
                  <span className="rp-queue-sort-label">
                    <ArrowUpDown size={14} aria-hidden />
                    Sort
                  </span>
                  <div className="rp-queue-sort-pills">
                    {QUEUE_SORTS.map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        className={`rp-queue-sort-pill${queueSort === id ? " rp-queue-sort-pill--on" : ""}`}
                        onClick={() => setQueueSort(id)}
                        aria-pressed={queueSort === id}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {party.queue.length === 0 ? (
              <div
                style={{ textAlign: "center", padding: "40px 10px" }}
                className="rp-subtle"
              >
                <div style={{ fontSize: 46 }}>📭</div>
                <p style={{ fontWeight: 800, marginTop: 6 }}>Queue's empty!</p>
                <p style={{ fontWeight: 700, fontSize: 13 }}>
                  Copy a link, then tap <b style={{ color: "#58CC02" }}>＋</b>
                </p>
              </div>
            ) : displayedQueue.length === 0 ? (
              <div
                style={{ textAlign: "center", padding: "40px 10px" }}
                className="rp-subtle"
              >
                <div style={{ fontSize: 46 }}>
                  {filterUserId ? "🔍" : "✅"}
                </div>
                <p style={{ fontWeight: 800, marginTop: 6 }}>
                  {filterUserId
                    ? `No videos from ${filterUser?.name || "this person"}`
                    : "All caught up!"}
                </p>
                <p style={{ fontWeight: 700, fontSize: 13 }}>
                  {filterUserId
                    ? "Try another filter or turn off your active filters."
                    : "Turn off Hide watched to see everything again."}
                </p>
              </div>
            ) : (
              <div className="rp-grid" style={{ paddingBottom: 90 }}>
                {displayedQueue.map((v, i) => {
                  const adder = resolveMember(party, v.addedById, v);
                  const isMySpot = v.id === myWatchingId;
                  const iWatched = v.watchedBy?.includes(me);
                  const reactionBurst = activeReactionBursts[v.id];
                  return (
                    <div
                      key={v.id}
                      ref={isMySpot ? mySpotRef : null}
                      className={`rp-card rp-rise rp-queue-card${isMySpot ? " rp-queue-card--yours" : ""}`}
                      onClick={() => playVideo(v)}
                      style={{
                        position: "relative",
                        overflow: "hidden",
                        animationDelay: i * 0.03 + "s",
                        borderColor: isMySpot
                          ? "var(--rp-accent-blue)"
                          : v.id === party.nowPlayingId
                            ? "var(--rp-accent-purple)"
                            : "var(--rp-border-accent)",
                      }}
                    >
                      <div
                        className={`rp-queue-thumb${isMySpot ? " rp-queue-thumb--yours" : ""}`}
                      >
                        <div className="rp-queue-thumb-media">
                          <Thumb v={v} />
                          {isMySpot && (
                            <div
                              className="rp-your-spot-shade"
                              aria-hidden="true"
                            />
                          )}
                          {iWatched && (
                            <div
                              className="rp-watched-shade"
                              aria-hidden="true"
                            />
                          )}
                        </div>
                        <PlatformBadge platform={v.platform} />
                        <div className="rp-reaction-bursts">
                          {reactionBurst && (
                            <ReactionBurst
                              key={`${reactionBurst.id}-${reactionBurst.emoji}`}
                              burstId={reactionBurst.id}
                              emoji={reactionBurst.emoji}
                              name={reactionBurst.name}
                              color={reactionBurst.color}
                              userId={reactionBurst.userId}
                              onDone={() =>
                                completeReactionBurst(v.id, reactionBurst.id)
                              }
                            />
                          )}
                        </div>
                        {iWatched && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUnwatchConfirm(v);
                            }}
                            className="rp-watched-badge"
                            aria-label="Mark as unwatched"
                          >
                            WATCHED
                          </button>
                        )}
                        {hasActivity(v) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewersVideo(v);
                            }}
                            className="rp-thumb-badge rp-watch-badge"
                            aria-label="Watchers and reactions"
                          >
                            <Eye size={16} />
                            <span>{v.watchCount || 0}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect =
                              e.currentTarget.getBoundingClientRect();
                            setReactionFan({
                              video: v,
                              x: rect.left + rect.width / 2,
                              y: rect.top + rect.height / 2,
                            });
                          }}
                          className="rp-thumb-badge rp-react-badge"
                          aria-label="React to video"
                        >
                          {v.reactions?.[me] ? (
                            <span className="rp-react-badge-emoji">
                              {v.reactions[me]}
                            </span>
                          ) : (
                            <Smile size={16} />
                          )}
                        </button>
                        {(v.addedById === me || isHost) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm(v);
                            }}
                            aria-label={
                              isHost && v.addedById !== me
                                ? "Remove video as host"
                                : "Remove video"
                            }
                            className="rp-thumb-badge rp-remove-badge"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      <div style={{ padding: "6px 8px 8px" }}>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: 12,
                            lineHeight: 1.2,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {v.title}
                        </div>
                        <ReactionChips
                          reactions={v.reactions}
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewersVideo(v);
                          }}
                        />
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            marginTop: 5,
                          }}
                        >
                          {adder.name && (
                            <Avatar id={adder.id} name={adder.name} sm />
                          )}
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: "var(--rp-text-2)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {memberLabel(adder)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rp-fab">
            <Btn
              tone="green"
              onClick={tapAdd}
              style={{
                borderRadius: 999,
                padding: "16px 22px",
                boxShadow: "0 6px 0 #46A302, 0 10px 20px rgba(88,204,2,.35)",
              }}
            >
              <Plus size={22} /> ADD VIDEO
            </Btn>
          </div>
        </div>
      )}

      {inviteOpen && party && (
        <Sheet onClose={() => setInviteOpen(false)}>
          <div style={{ textAlign: "center" }}>
            <Share2 size={32} color="var(--rp-accent-blue)" style={{ marginBottom: 8 }} />
            <h3 className="rp-head" style={{ fontSize: 20, margin: "0 0 4px" }}>Invite friends</h3>
            <p className="rp-muted" style={{ fontWeight: 700, fontSize: 13, marginBottom: 20 }}>
              Party code <span style={{ color: "var(--rp-accent-blue-dk)", letterSpacing: 2 }}>{party.code}</span>
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Btn tone="blue" full onClick={copyInviteLink}>
              <Copy size={18} /> COPY LINK
            </Btn>
            <Btn tone="green" full onClick={shareInviteMessage}>
              <Share2 size={18} /> SHARE
            </Btn>
            <Btn tone="gray" full onClick={() => setInviteOpen(false)}>CANCEL</Btn>
          </div>
        </Sheet>
      )}

      {deleteConfirm && (
        <Sheet onClose={() => setDeleteConfirm(null)}>
          <div style={{ textAlign: "center" }}>
            <Trash2
              size={32}
              color="var(--rp-accent-red)"
              style={{ marginBottom: 8 }}
            />
            <h3 className="rp-head" style={{ fontSize: 20, margin: "0 0 8px" }}>
              Remove from queue?
            </h3>
            <p
              className="rp-muted"
              style={{ fontWeight: 700, fontSize: 13, marginBottom: 20 }}
            >
              {isHost && deleteConfirm.addedById !== me
                ? `Remove "${deleteConfirm.title.slice(0, 40)}${deleteConfirm.title.length > 40 ? "…" : ""}" from the party queue.`
                : "This video will be removed from the party queue."}
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Btn tone="red" full onClick={confirmDelete}>
              YES, REMOVE
            </Btn>
            <Btn tone="gray" full onClick={() => setDeleteConfirm(null)}>
              CANCEL
            </Btn>
          </div>
        </Sheet>
      )}

      {unwatchConfirm && (
        <Sheet onClose={() => setUnwatchConfirm(null)}>
          <div style={{ textAlign: "center" }}>
            <h3 className="rp-head" style={{ fontSize: 20, margin: "0 0 8px" }}>
              Mark as unwatched?
            </h3>
            <p
              className="rp-muted"
              style={{ fontWeight: 700, fontSize: 13, marginBottom: 20 }}
            >
              Remove your watched status from this video.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Btn tone="green" full onClick={confirmUnwatch}>
              YES, MARK UNWATCHED
            </Btn>
            <Btn tone="gray" full onClick={() => setUnwatchConfirm(null)}>
              CANCEL
            </Btn>
          </div>
        </Sheet>
      )}

      {reactionFan && (
        <ReactionFan
          x={reactionFan.x}
          y={reactionFan.y}
          value={
            (
              party?.queue.find((q) => q.id === reactionFan.video.id) ||
              reactionFan.video
            ).reactions?.[me] || null
          }
          onPick={(emoji) => {
            const vid =
              party?.queue.find((q) => q.id === reactionFan.video.id) ||
              reactionFan.video;
            setReaction(vid, emoji);
            setReactionFan(null);
          }}
          onClose={() => setReactionFan(null)}
        />
      )}

      {viewersVideo && (
        <Sheet onClose={() => setViewersVideo(null)}>
          <div style={{ textAlign: "center" }}>
            <Eye size={32} color="var(--rp-accent-green)" />
            <h3
              className="rp-head"
              style={{ fontSize: 20, margin: "8px 0 2px" }}
            >
              Who watched
            </h3>
            <p
              className="rp-muted rp-sheet-video-title"
              style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}
            >
              {viewersVideo.title}
            </p>
          </div>
          {reactionSummary(viewersVideo.reactions).length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <p
                className="rp-subtle"
                style={{ fontWeight: 800, fontSize: 12, marginBottom: 8 }}
              >
                Reactions
              </p>
              <ReactionChips reactions={viewersVideo.reactions} />
            </div>
          )}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginTop: 16,
            }}
          >
            {activityFor(viewersVideo).length === 0 ? (
              <p
                className="rp-muted"
                style={{ fontWeight: 700, fontSize: 13, textAlign: "center" }}
              >
                No activity yet
              </p>
            ) : (
              activityFor(viewersVideo).map((w) => (
                <div key={w.id} className="rp-activity-row">
                  <Avatar id={w.id} name={w.name} sm />
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: 14,
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {memberLabel(w)}
                  </span>
                  {w.id === party?.hostId && (
                    <Crown size={13} color="#FFC800" fill="#FFC800" />
                  )}
                  <div className="rp-activity-tags">
                    {w.watched && (
                      <span className="rp-activity-tag rp-activity-tag--watched">
                        Watched
                      </span>
                    )}
                    {w.reaction && (
                      <span className="rp-activity-tag rp-activity-tag--react">
                        {w.reaction}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Sheet>
      )}

      {pasteBusy && !pasteOpen && (
        <div className="rp-paste-reading-hint" role="status" aria-live="polite">
          <Loader2 size={16} className="rp-spin" />
          <span>
            {isIOS()
              ? "Tap Paste when Safari prompts at the top of the screen"
              : "Reading clipboard…"}
          </span>
        </div>
      )}

      {pasteOpen && (
        <Sheet
          panelRef={pastePanelRef}
          panelClassName="rp-sheet-panel--paste"
          onClose={() => {
            setPasteOpen(false);
            setPasteVal("");
          }}
        >
          <h3 className="rp-head" style={{ fontSize: 20, textAlign: "center" }}>
            Add a link
          </h3>
          <p
            className="rp-muted"
            style={{
              fontWeight: 700,
              fontSize: 13,
              textAlign: "center",
              marginTop: 4,
            }}
          >
            TikTok, Instagram Reels, or YouTube Shorts
          </p>
          <div className="rp-paste-form">
            {pasteBusy && (
              <div className="rp-paste-busy">
                <Loader2 size={18} className="rp-spin" />
                <span>Reading clipboard…</span>
              </div>
            )}
            {!pasteBusy && !pasteVal && (
              <Btn tone="blue" full sm onClick={pasteFromClipboard}>
                <ClipboardPaste size={18} />{" "}
                {isIOS() ? "PASTE FROM CLIPBOARD" : "PASTE LINK"}
              </Btn>
            )}
            <input
              ref={pasteInputRef}
              className="rp-input"
              placeholder="https://…"
              value={pasteVal}
              inputMode="url"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              onFocus={() => {
                if (!pasteVal) {
                  clipboardReadRef.current = null;
                  void applyClipboardToPaste(hiddenPasteRef.current);
                }
              }}
              onPaste={(e) => {
                const txt = normalizeClipboardText(e.clipboardData?.getData("text"));
                if (!txt) return;
                e.preventDefault();
                setPasteVal(txt);
              }}
              onChange={(e) => setPasteVal(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                detectPlatform(pasteVal) &&
                ingestLink(pasteVal)
              }
            />
            {pasteVal && !detectPlatform(pasteVal) && (
              <p style={{ color: "#FF4B4B", fontWeight: 800, fontSize: 13 }}>
                Hmm, that link isn't supported 🙈
              </p>
            )}
            <Btn
              tone="green"
              full
              disabled={adding || !detectPlatform(pasteVal)}
              onClick={() => ingestLink(pasteVal)}
            >
              {adding ? (
                <>
                  <Loader2 size={18} className="rp-spin" />{" "}
                  {addMsg || "Adding…"}
                </>
              ) : (
                "ADD TO QUEUE"
              )}
            </Btn>
          </div>
        </Sheet>
      )}

      {adding && !pasteOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--rp-loading)",
            zIndex: 65,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <Loader2 size={40} color="#58CC02" className="rp-spin" />
          <p style={{ fontWeight: 800, color: "#58CC02" }}>
            {addMsg || "Adding…"}
          </p>
        </div>
      )}

      <textarea
        ref={hiddenPasteRef}
        className="rp-hidden-paste"
        tabIndex={-1}
        aria-hidden
        defaultValue=""
      />
    </div>
  );
}
