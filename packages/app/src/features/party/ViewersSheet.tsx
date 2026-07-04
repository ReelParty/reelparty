"use client";

import { ScrollView, View } from "react-native";
import { Avatar, Heading, Icons, Muted, Text } from "@reelparty/ui";
import {
  memberLabel,
  reactionSummary,
  type PartyView,
  type QueueItem,
  type ResolvedMember,
} from "@reelparty/shared";
import { Sheet } from "../../components/Sheet";
import { ReactionChips } from "../../components/ReactionChips";

export function ViewersSheet({
  video,
  party,
  resolve,
  onClose,
}: {
  video: QueueItem | null;
  party: PartyView | null;
  resolve: (id: string, video?: QueueItem) => ResolvedMember;
  onClose: () => void;
}) {
  if (!video) return <Sheet open={false} onClose={onClose} children={null} />;

  const ids = new Set<string>([
    ...(video.watchedBy || []),
    ...Object.keys(video.reactions || {}),
  ]);
  const rows = [...ids]
    .map((id) => {
      const m = resolve(id, video);
      return {
        ...m,
        watched: video.watchedBy?.includes(id) ?? false,
        reaction: video.reactions?.[id] || null,
      };
    })
    .sort(
      (a, b) =>
        Number(b.watched) - Number(a.watched) || a.name.localeCompare(b.name),
    );

  return (
    <Sheet open onClose={onClose}>
      <View className="items-center">
        <View className="flex-row items-center gap-1.5">
          <Icons.Eye size={20} color="#58cc02" />
          <Heading style={{ fontSize: 18 }}>Who watched</Heading>
        </View>
        <Muted numberOfLines={2} className="mt-1 text-center text-[13px]">
          {video.title}
        </Muted>
      </View>

      {reactionSummary(video.reactions).length > 0 ? (
        <View className="mt-3">
          <ReactionChips reactions={video.reactions} lg />
        </View>
      ) : null}

      <ScrollView className="mt-4 max-h-80">
        {rows.length === 0 ? (
          <Muted className="text-center text-[13px]">No activity yet</Muted>
        ) : (
          rows.map((w) => (
            <View
              key={w.id}
              className="mb-1 flex-row items-center gap-2 rounded-xl border-2 border-border bg-surface py-1 pl-1.5 pr-2.5"
            >
              <Avatar id={w.id} name={w.name} color={w.color} faceIndex={w.avatarFace} sm />
              <View className="min-w-0 flex-1 flex-row items-center gap-1">
                <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "800" }}>
                  {memberLabel(w)}
                </Text>
                {w.id === party?.hostId ? (
                  <Icons.Crown size={13} color="#FFC800" fill="#FFC800" />
                ) : null}
              </View>
              {w.reaction ? <Text style={{ fontSize: 16 }}>{w.reaction}</Text> : null}
            </View>
          ))
        )}
      </ScrollView>
    </Sheet>
  );
}
