import { getShareExtensionKey } from "expo-share-intent";

/**
 * iOS share extensions open the app via `reelparty://dataUrl=...`, which has
 * no matching route. Rewrite it to the share-intent screen; the hook there
 * reads the actual payload from the native module.
 */
export function redirectSystemPath({ path }: { path: string; initial: string }) {
  try {
    if (path.includes(`dataUrl=${getShareExtensionKey()}`)) {
      return "/shareintent";
    }
    return path;
  } catch {
    return "/";
  }
}
