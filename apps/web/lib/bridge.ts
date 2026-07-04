import type { PlatformBridge } from "@reelparty/app";

/** Web platform bridge (clipboard, Web Share API, new-tab open). */
export const webBridge: PlatformBridge = {
  getWebOrigin() {
    if (typeof window !== "undefined") return window.location.origin;
    return process.env.NEXT_PUBLIC_WEB_ORIGIN ?? "http://localhost:3000";
  },
  async readClipboard() {
    try {
      return (await navigator.clipboard.readText()) || "";
    } catch {
      return "";
    }
  },
  async share({ title, text, url }) {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  },
  async copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  },
  openVideo(url) {
    if (typeof window !== "undefined")
      window.open(url, "_blank", "noopener,noreferrer");
  },
};
