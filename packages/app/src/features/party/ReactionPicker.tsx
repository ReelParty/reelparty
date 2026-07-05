"use client";

import { Pressable, View } from "react-native";
import { Heading, Text } from "@reelparty/ui";
import { CUSTOM_EMOJIS, REACTIONS } from "@reelparty/shared";
import { Sheet } from "../../components/Sheet";
import { SheetHeader } from "../../components/SheetHeader";

export function ReactionPicker({
  open,
  current,
  onPick,
  onClose,
}: {
  open: boolean;
  current: string | null;
  onPick: (emoji: string) => void;
  onClose: () => void;
}) {
  const all = [...REACTIONS, ...CUSTOM_EMOJIS.filter((e) => !REACTIONS.includes(e as never))];
  return (
    <Sheet open={open} onClose={onClose}>
      <SheetHeader>
        <Heading style={{ fontSize: 20 }}>Pick a reaction</Heading>
      </SheetHeader>
      <View className="mt-4 flex-row flex-wrap justify-center gap-2">
        {all.map((emoji) => {
          const on = current === emoji;
          return (
            <Pressable
              key={emoji}
              accessibilityRole="button"
              onPress={() => onPick(emoji)}
              accessibilityLabel={`React ${emoji}`}
              className="h-12 w-12 items-center justify-center rounded-xl border-2"
              style={{
                borderColor: on ? "#58cc02" : "#2a2a38",
                backgroundColor: on ? "rgba(88,204,2,0.15)" : "#15151c",
              }}
            >
              <Text style={{ fontSize: 24 }}>{emoji}</Text>
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}
