import type { DetectedLink } from "./types";

export function extractLinkFromText(text: string): string {
  if (!text) return "";
  const match = text.match(/https?:\/\/[^\s<>"']+/);
  return match ? match[0].replace(/[.,)]+$/, "") : text.trim();
}

export function normalizeClipboardText(raw: string | null | undefined): string {
  const trimmed = (raw || "").trim();
  if (!trimmed) return "";
  return extractLinkFromText(trimmed) || trimmed;
}

/** Detect a supported short-video platform + id from a raw URL/string. */
export function detectPlatform(raw: string | null | undefined): DetectedLink | null {
  if (!raw) return null;
  const url = extractLinkFromText(raw.trim()) || raw.trim();
  const yt = url.match(
    /(?:youtube\.com\/(?:shorts\/|watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/,
  );
  if (yt) return { platform: "youtube", videoId: yt[1] ?? null, url };
  const tt = url.match(/\/video\/(\d+)/);
  if (/tiktok\.com/.test(url) || /vm\.tiktok\.com/.test(url)) {
    return { platform: "tiktok", videoId: tt?.[1] ?? null, url };
  }
  const ig = url.match(/instagram\.com\/(?:reel|reels|p)\/([A-Za-z0-9_-]+)/);
  if (ig) return { platform: "instagram", videoId: ig[1] ?? null, url };
  const fbWatch = url.match(/fb\.watch\/([A-Za-z0-9_-]+)/);
  if (fbWatch) return { platform: "facebook", videoId: fbWatch[1] ?? null, url };
  if (/facebook\.com|fb\.com|m\.facebook\.com/.test(url)) {
    const watchV = url.match(/[?&]v=(\d+)/);
    if (/facebook\.com\/watch/.test(url) || /\/watch\/\?/.test(url)) {
      return { platform: "facebook", videoId: watchV?.[1] ?? null, url };
    }
    const reel = url.match(/facebook\.com\/(?:reel|reels)\/(\d+)/);
    if (reel) return { platform: "facebook", videoId: reel[1] ?? null, url };
    const videos = url.match(/facebook\.com\/(?:[^/]+\/)?videos\/(\d+)/);
    if (videos) return { platform: "facebook", videoId: videos[1] ?? null, url };
    const shareV = url.match(/facebook\.com\/share\/v\/([^/?#]+)/);
    if (shareV) return { platform: "facebook", videoId: shareV[1] ?? null, url };
    const shareR = url.match(/facebook\.com\/share\/r\/([^/?#]+)/);
    if (shareR) return { platform: "facebook", videoId: shareR[1] ?? null, url };
    if (/video\.php/.test(url) && watchV) {
      return { platform: "facebook", videoId: watchV[1] ?? null, url };
    }
  }
  return null;
}

/** Pull a 5-digit join code out of an incoming deep link / universal link. */
export function parseJoinCodeFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const queryMatch = url.match(/[?&]join=(\d{5})\b/);
  if (queryMatch) return queryMatch[1] ?? null;
  const pathMatch = url.match(/\/join\/(\d{5})\/?(?:[?#]|$)/);
  if (pathMatch) return pathMatch[1] ?? null;
  return null;
}
