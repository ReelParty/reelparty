"use client";

import { Pressable, View } from "react-native";
import { Icons, Text } from "@reelparty/ui";

export function PartyHeader({
  code,
  onLeave,
  onInvite,
  onOpenNowPlaying,
}: {
  code: string;
  onLeave: () => void;
  onInvite: () => void;
  onOpenNowPlaying: () => void;
}) {
  return (
    <View className="mt-5 flex-row items-center justify-between">
      <Pressable
        onPress={onLeave}
        accessibilityLabel="Leave party"
        className="h-10 w-10 items-center justify-center rounded-xl bg-btnGhost"
      >
        <Icons.Home size={18} color="#9898a8" />
      </Pressable>

      <Pressable
        onPress={onInvite}
        accessibilityLabel={`Share invite link for party ${code}`}
        className="flex-row items-center gap-2 rounded-card border-2 px-3.5 py-2"
        style={{ borderColor: "#58cc02", backgroundColor: "rgba(88,204,2,0.1)" }}
      >
        <Icons.Share2 size={16} color="#58cc02" />
        <Text className="font-head" style={{ fontSize: 22, letterSpacing: 4, color: "#46a302", fontWeight: "700" }}>
          {code}
        </Text>
        <Text style={{ fontSize: 11, fontWeight: "800", color: "#58cc02" }}>INVITE</Text>
      </Pressable>

      <Pressable
        onPress={onOpenNowPlaying}
        accessibilityLabel="Open party spot"
        className="h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: "#CE82FF", borderBottomWidth: 4, borderBottomColor: "#A568CC" }}
      >
        <Icons.Tv size={18} color="#fff" />
      </Pressable>
    </View>
  );
}
