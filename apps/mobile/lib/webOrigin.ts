import Constants from "expo-constants";

/**
 * Resolve the web app origin for invite links.
 *  1. EXPO_PUBLIC_WEB_ORIGIN (staging/production builds), else
 *  2. the Metro dev-server host on port 3000 (local Next.js app), else
 *  3. localhost (simulator only).
 */
function devHost(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants.expoGoConfig?.debuggerHost as string | undefined);
  const host = hostUri?.split(":")[0];
  return host ? `http://${host}:3000` : null;
}

export const WEB_ORIGIN =
  process.env.EXPO_PUBLIC_WEB_ORIGIN || devHost() || "http://localhost:3000";
