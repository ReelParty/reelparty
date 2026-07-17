import "react-native-reanimated";
import "../global.css";

import { Fredoka_600SemiBold, Fredoka_700Bold } from "@expo-google-fonts/fredoka";
import {
  Nunito_400Regular,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from "@expo-google-fonts/nunito";
import { useEffect } from "react";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  ShareIntentProvider,
  useShareIntentContext,
} from "expo-share-intent";
import { AppProvider } from "@reelparty/app";
import { nativeStore } from "../lib/store";
import { nativeBridge } from "../lib/bridge";
import { API_URL } from "../lib/apiUrl";

/**
 * Route to the share-intent screen whenever a share arrives. Handles Android
 * (no deep link involved) and shares received while the app is already open;
 * cold-start iOS shares are also routed by app/+native-intent.ts.
 */
function ShareIntentRedirector() {
  const router = useRouter();
  const { hasShareIntent } = useShareIntentContext();
  useEffect(() => {
    if (hasShareIntent) router.replace("/shareintent");
  }, [hasShareIntent, router]);
  return null;
}

export default function RootLayout() {
  // Register the design-system fonts under the single family names the shared
  // Tailwind preset expects ("Fredoka" for headings, "Nunito" for body).
  const [loaded] = useFonts({
    Fredoka: Fredoka_600SemiBold,
    Fredoka_700Bold,
    Nunito: Nunito_400Regular,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0a0a0f" }}>
      <ShareIntentProvider>
        <AppProvider apiUrl={API_URL} store={nativeStore} bridge={nativeBridge}>
          <ShareIntentRedirector />
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "slide_from_right",
              contentStyle: { backgroundColor: "#0a0a0f" },
            }}
          />
        </AppProvider>
      </ShareIntentProvider>
    </GestureHandlerRootView>
  );
}
