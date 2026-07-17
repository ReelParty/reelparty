import { useEffect, useRef } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useShareIntentContext } from "expo-share-intent";
import { useHandleSharedVideo } from "@reelparty/app";
import { Screen, Spinner, Text } from "@reelparty/ui";

const NO_INTENT_BAILOUT_MS = 4000;

/**
 * Landing screen for links shared from other apps (TikTok, Instagram,
 * YouTube, Facebook). Grabs the shared URL and hands it to the shared
 * add-to-party flow, which toasts and navigates when done.
 */
export default function ShareIntentScreen() {
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent } =
    useShareIntentContext();
  const handleShared = useHandleSharedVideo();
  const handled = useRef(false);

  useEffect(() => {
    if (!hasShareIntent || handled.current) return;
    handled.current = true;
    const raw = shareIntent.webUrl || shareIntent.text || "";
    resetShareIntent();
    void handleShared(raw);
  }, [hasShareIntent, shareIntent, resetShareIntent, handleShared]);

  // Safety net: if we landed here but no share payload ever arrives
  // (e.g. the intent was cleared while backgrounded), don't strand the user.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!handled.current) router.replace("/");
    }, NO_INTENT_BAILOUT_MS);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <Screen>
      <View className="flex-1 items-center justify-center gap-4">
        <Spinner />
        <Text style={{ fontSize: 15, fontWeight: "800", color: "#9898a8" }}>
          Adding to your party…
        </Text>
      </View>
    </Screen>
  );
}
