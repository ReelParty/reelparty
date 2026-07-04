"use client";

import { useState } from "react";
import { Pressable, View } from "react-native";
import { Avatar, Icons, Text } from "@reelparty/ui";
import type { ResolvedMember } from "@reelparty/shared";

export function MembersPill({
  members,
  hostId,
  isHost,
  onKick,
}: {
  members: ResolvedMember[];
  hostId: string;
  isHost: boolean;
  onKick: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View className="mt-3.5 overflow-hidden rounded-card border-2 border-border bg-surface2">
      <Pressable
        onPress={() => setOpen((o) => !o)}
        className="flex-row items-center gap-2 px-3.5 py-2"
        accessibilityRole="button"
      >
        <Icons.Users size={16} color="#ececf1" />
        <Text style={{ fontSize: 13, fontWeight: "800" }}>
          {members.length} {members.length === 1 ? "person" : "in party"}
        </Text>
        <View className="ml-auto">
          <Icons.ChevronDown size={16} color="#6b6b7b" />
        </View>
      </Pressable>
      {open ? (
        <View className="flex-row flex-wrap gap-1.5 border-t border-border px-3 pb-3 pt-2.5">
          {members.map((m) => (
            <View
              key={m.id}
              className="flex-row items-center gap-2 rounded-full border-2 border-border bg-surface py-[3px] pl-[3px] pr-2.5"
            >
              <Avatar id={m.id} name={m.name} color={m.color} faceIndex={m.avatarFace} sm />
              <Text style={{ fontSize: 13, fontWeight: "800" }}>{m.name}</Text>
              {m.id === hostId ? (
                <Icons.Crown size={13} color="#FFC800" fill="#FFC800" />
              ) : null}
              {isHost && m.id !== hostId ? (
                <Pressable onPress={() => onKick(m.id)} accessibilityLabel={`Remove ${m.name}`}>
                  <Icons.X size={14} color="#6b6b7b" />
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
