import { type ReactNode } from "react";
import { Platform, View, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { cn } from "./cn";

const pageBg = "#0a0a0f";

const columnClass = (className?: string) =>
  cn("mx-auto w-full max-w-[440px] flex-1 px-[18px] py-5", className);

/** Flex column so `flex-1` spacers push bottom actions down. */
const columnStyle: ViewStyle = { flex: 1, flexDirection: "column" };

/**
 * Page shell: full-height dark background, content centered and capped at the
 * phone-width column used across web + native.
 */
export function Screen({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  // Web: plain View at exactly one viewport tall. SafeAreaView adds inset
  // padding on top of minHeight, which creates a huge top gap and page scroll.
  if (Platform.OS === "web") {
    const webShell: ViewStyle = {
      height: "100dvh" as ViewStyle["height"],
    };
    return (
      <View className="rp-screen-shell" style={webShell}>
        <View className={columnClass(className)} style={columnStyle}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: pageBg }} edges={["top", "bottom"]}>
      <View className={columnClass(className)} style={columnStyle}>
        {children}
      </View>
    </SafeAreaView>
  );
}
