import type { Platform, QueueSortId } from "./types";

/** Duolingo-ish button palette (mirrors PAL in the original web/mobile apps). */
export const PAL = {
  green: { c: "#58CC02", lip: "#46A302", text: "#fff" },
  blue: { c: "#1CB0F6", lip: "#1899D6", text: "#fff" },
  red: { c: "#FF4B4B", lip: "#E63E3E", text: "#fff" },
  yellow: { c: "#FFC800", lip: "#E6AD00", text: "#3C3C3C" },
  purple: { c: "#CE82FF", lip: "#A568CC", text: "#fff" },
  gray: { c: "#2A2A35", lip: "#1A1A22", text: "#AAA" },
} as const;

export type ButtonTone = keyof typeof PAL;

export const PLATFORM_LABEL: Record<Platform, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  facebook: "Facebook",
};

export const PLATFORM_COLOR: Record<Platform, string> = {
  youtube: "#FF0000",
  tiktok: "#000000",
  instagram: "#C13584",
  facebook: "#1877F2",
};

export const INSTAGRAM_GRADIENT = [
  "#feda75",
  "#fa7e1e",
  "#d62976",
  "#962fbf",
] as const;

export const REACTIONS = ["🔥", "😂", "❤️", "😮", "🥹", "💀"] as const;

export const CUSTOM_EMOJIS = [
  "😀", "🤣", "😭", "🥰", "😘", "😱", "🤯", "😤", "😎", "🥳",
  "👀", "💔", "👏", "🙏", "💯", "✨", "🎉", "👑", "💩", "🤡",
  "😈", "🫡", "🤷", "💪", "🍿", "🫶", "👎", "💙", "☠️", "🦄",
  "🤔", "😬", "🫠", "🤪", "😡", "🥺", "💅", "🙄", "😴", "🤝",
  "👊", "🫨", "🤌", "🎯", "⚡", "🌶️", "😳", "🙌", "🗿", "🥶",
] as const;

/** Deduped pool used for the falling welcome-screen texture. */
export const WELCOME_TEXTURE_EMOJIS = [
  ...new Set<string>([...REACTIONS, ...CUSTOM_EMOJIS]),
];

export const QUEUE_SORTS: ReadonlyArray<{ id: QueueSortId; label: string }> = [
  { id: "added", label: "Queue" },
  { id: "platform", label: "Platform" },
  { id: "reaction", label: "Reactions" },
  { id: "views", label: "Watches" },
];

export function defaultTitle(platform: Platform): string {
  if (platform === "tiktok") return "TikTok video";
  if (platform === "instagram") return "Instagram Reel";
  if (platform === "facebook") return "Facebook video";
  return "YouTube Short";
}

export function ytThumb(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/** Random toast shown when a video is successfully added to the queue. */
export const ADD_VIDEO_TOASTS = [
  "Oh that's a good one!",
  "You have such great taste",
  "Chef's kiss 👌",
  "Excellent choice",
  "This party just got better",
  "Okay, taste icon",
  "We needed this one",
  "Fire pick 🔥",
  "The queue thanks you",
  "Iconic addition",
  "You understood the assignment",
  "Certified banger incoming",
  "Your taste? Immaculate.",
  "Now we're talking",
  "Bold move — respect",
  "Adding this before anyone changes their mind",
  "That's going straight to the queue",
  "The people are gonna love this",
  "Elite curator behavior",
  "Consider the vibe elevated ✨",
] as const;

export function pickAddVideoToast(): string {
  const line =
    ADD_VIDEO_TOASTS[Math.floor(Math.random() * ADD_VIDEO_TOASTS.length)]!;
  return `Video added!\n${line}`;
}
