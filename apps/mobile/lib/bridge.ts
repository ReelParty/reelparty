import * as Clipboard from "expo-clipboard";
import { Linking, Share } from "react-native";
import type { PlatformBridge } from "@reelparty/app";
import { WEB_ORIGIN } from "./webOrigin";

/** Native platform bridge (Expo clipboard, RN share sheet, deep open). */
export const nativeBridge: PlatformBridge = {
  getWebOrigin: () => WEB_ORIGIN,
  async readClipboard() {
    try {
      return (await Clipboard.getStringAsync()) || "";
    } catch {
      return "";
    }
  },
  async share({ title, text, url }) {
    try {
      const message = [text, url].filter(Boolean).join(" ").trim();
      await Share.share({ title, message, url });
      return true;
    } catch {
      return false;
    }
  },
  async copy(text) {
    try {
      await Clipboard.setStringAsync(text);
      return true;
    } catch {
      return false;
    }
  },
  openVideo(url) {
    Linking.openURL(url).catch(() => {
      /* ignore unsupported URLs */
    });
  },
};
