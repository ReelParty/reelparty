"use client";

import { Pressable } from "react-native";
import { Icons } from "@reelparty/ui";

export function BackBar({ onBack }: { onBack: () => void }) {
  return (
    <Pressable
      onPress={onBack}
      accessibilityLabel="Go back"
      className="mt-5 h-10 w-10 items-center justify-center self-start rounded-xl bg-btnGhost"
    >
      <Icons.ArrowLeft size={18} color="#9898a8" />
    </Pressable>
  );
}
