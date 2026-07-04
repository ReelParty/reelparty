/**
 * Platform capabilities that differ between web and native are injected at the
 * app root so every screen/hook stays platform-agnostic.
 */
export interface SharePayload {
  title: string;
  text: string;
  url: string;
}

export interface PlatformBridge {
  /** Resolve the web app origin for shareable invite links (called at share time). */
  getWebOrigin(): string;
  /** Read a URL from the clipboard (returns "" if unavailable/denied). */
  readClipboard(): Promise<string>;
  /** Native share sheet; resolve true if shared. Returns false to fall back. */
  share(payload: SharePayload): Promise<boolean>;
  /** Copy text to the clipboard; resolve true on success. */
  copy(text: string): Promise<boolean>;
  /** Open a video URL (new tab on web, external app/browser on native). */
  openVideo(url: string): void;
}

export function inviteUrl(bridge: PlatformBridge, code: string): string {
  return `${bridge.getWebOrigin().replace(/\/$/, "")}/join/${encodeURIComponent(code)}`;
}
