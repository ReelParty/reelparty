"use client";

import { View } from "react-native";
import { Heading, Muted, PlatformLogo, Text } from "@reelparty/ui";
import { PLATFORM_COLOR, PLATFORM_LABEL, type Platform } from "@reelparty/shared";

const PLATFORMS: Platform[] = ["tiktok", "youtube", "instagram", "facebook"];

export function WelcomeLockup() {
  return (
    <View className="items-center">
      <View className="mb-4 h-[104px] w-[104px] items-center justify-center rounded-[28px] border-2 border-border bg-surface2">
        <Text style={{ fontSize: 48 }}>🥳</Text>
      </View>
      <View className="flex-row items-baseline">
        <Heading style={{ fontSize: 48, color: "#ececf1" }}>Reel</Heading>
        <Heading style={{ fontSize: 48, color: "#58cc02" }}>Party</Heading>
      </View>
      <Muted className="mt-3 text-center text-[15px] leading-6">
        Watch short videos together.{"\n"}Build the queue with your crew. 🍿
      </Muted>
      <View className="mt-4 flex-row flex-wrap justify-center gap-2">
        {PLATFORMS.map((p) => (
          <View
            key={p}
            className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{ backgroundColor: PLATFORM_COLOR[p] }}
          >
            <PlatformLogo platform={p} size={13} />
            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>
              {PLATFORM_LABEL[p]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
