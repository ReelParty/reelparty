"use client";

import { Pressable, ScrollView, View } from "react-native";
import { Avatar, Icons, Text } from "@reelparty/ui";
import {
  QUEUE_SORTS,
  avatarColorFor,
  type QueueSortId,
  type ResolvedMember,
  type SortDir,
} from "@reelparty/shared";

function Pill({
  active,
  accent,
  onPress,
  label,
  children,
}: {
  active: boolean;
  accent?: string;
  onPress: () => void;
  label: string;
  children: React.ReactNode;
}) {
  const color = accent ?? "#1cb0f6";
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="flex-row items-center gap-1.5 rounded-full border-2 px-2.5 py-1.5"
      style={{
        borderColor: active ? color : "#2a2a38",
        backgroundColor: active ? `${color}22` : "#1c1c26",
      }}
    >
      {children}
    </Pressable>
  );
}

export function QueueControls({
  queueLength,
  adders,
  me,
  filterUserId,
  setFilterUserId,
  queueSort,
  setQueueSort,
  queueSortDir,
  setQueueSortDir,
}: {
  queueLength: number;
  adders: ResolvedMember[];
  me: string;
  filterUserId: string | null;
  setFilterUserId: (fn: (v: string | null) => string | null) => void;
  queueSort: QueueSortId;
  setQueueSort: (id: QueueSortId) => void;
  queueSortDir: SortDir;
  setQueueSortDir: (fn: (d: SortDir) => SortDir) => void;
}) {
  return (
    <View className="gap-2.5">
      {adders.length > 1 ? (
        <View className="flex-row items-center gap-2">
          <Icons.Filter size={14} color="#6b6b7b" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {adders.map((m) => {
              const active = filterUserId === m.id;
              const accent = m.color || avatarColorFor(m.id);
              return (
                <Pill
                  key={m.id}
                  active={active}
                  accent={accent}
                  onPress={() => setFilterUserId((id) => (id === m.id ? null : m.id))}
                  label={`Filter by ${m.id === me ? "you" : m.name}`}
                >
                  <Avatar id={m.id} name={m.name} color={m.color} faceIndex={m.avatarFace} sm />
                  <Text style={{ fontSize: 12, fontWeight: "800", color: active ? accent : "#9898a8" }}>
                    {m.id === me ? "You" : m.name}
                  </Text>
                </Pill>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {queueLength > 1 ? (
        <View className="flex-row items-center gap-2">
          <Icons.ArrowUpDown size={14} color="#6b6b7b" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {QUEUE_SORTS.map(({ id, label }) => {
              const active = queueSort === id;
              return (
                <Pill
                  key={id}
                  active={active}
                  onPress={() => {
                    if (active) setQueueSortDir((d) => (d === "asc" ? "desc" : "asc"));
                    else {
                      setQueueSort(id);
                      setQueueSortDir(() => "asc");
                    }
                  }}
                  label={active ? `${label}, ${queueSortDir}` : `Sort by ${label}`}
                >
                  {active ? (
                    queueSortDir === "asc" ? (
                      <Icons.ArrowUp size={12} color="#1cb0f6" />
                    ) : (
                      <Icons.ArrowDown size={12} color="#1cb0f6" />
                    )
                  ) : null}
                  <Text style={{ fontSize: 12, fontWeight: "800", color: active ? "#1cb0f6" : "#9898a8" }}>
                    {label}
                  </Text>
                </Pill>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
