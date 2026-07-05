"use client";

import { Pressable, View } from "react-native";
import { Avatar, Card, Icons, PlatformBadge, Text } from "@reelparty/ui";
import {
  formatAddedDate,
  hasActivity,
  memberLabel,
  type QueueItem,
  type ResolvedMember,
} from "@reelparty/shared";
import { Thumb } from "../../components/Thumb";
import { ReactionChips } from "../../components/ReactionChips";
import { ReactionBurst } from "./ReactionBurst";
import type { ReactionBurstPayload } from "./reactionBurstParticles";

interface QueueCardProps {
  video: QueueItem;
  adder: ResolvedMember;
  me: string;
  isHost: boolean;
  isMySpot: boolean;
  /** When false during dismiss, blue YOUR SPOT styling is stripped immediately. */
  showAsMySpot?: boolean;
  iWatched: boolean;
  myReaction: string | null;
  reactionBurst?: ReactionBurstPayload | null;
  onReactionBurstDone?: () => void;
  onPlay: () => void;
  onReact: () => void;
  onRemove: () => void;
  onUnwatch: () => void;
  onViewers: () => void;
}

export function QueueCard({
  video,
  adder,
  me,
  isHost,
  isMySpot,
  showAsMySpot,
  iWatched,
  myReaction,
  reactionBurst,
  onReactionBurstDone,
  onPlay,
  onReact,
  onRemove,
  onUnwatch,
  onViewers,
}: QueueCardProps) {
  const highlightSpot = showAsMySpot ?? isMySpot;
  return (
    <Card
      className="overflow-hidden"
      style={{
        borderColor: highlightSpot ? "#1cb0f6" : "#3b3b3b",
      }}
    >
      <Pressable onPress={onPlay}>
        <View className="relative aspect-square w-full bg-black">
          <Thumb video={video} />
          {highlightSpot ? (
            <View
              pointerEvents="none"
              className="absolute inset-0"
              style={{ backgroundColor: "rgba(28,176,246,0.5)" }}
            />
          ) : iWatched ? (
            <View
              pointerEvents="none"
              className="absolute inset-0"
              style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            />
          ) : null}

          <View className="absolute left-[7px] top-[7px]">
            <PlatformBadge platform={video.platform} />
          </View>

          {iWatched ? (
            <Pressable
              onPress={onUnwatch}
              accessibilityLabel="Mark as unwatched"
              className="absolute right-[7px] top-[7px] rounded-lg px-2 py-1"
              style={{ backgroundColor: "#58cc02" }}
            >
              <Text style={{ color: "#fff", fontSize: 10, fontWeight: "800" }}>
                WATCHED
              </Text>
            </Pressable>
          ) : null}

          <View
            pointerEvents="none"
            className="absolute inset-0 z-[4] overflow-hidden"
          >
            {reactionBurst ? (
              <ReactionBurst
                key={`${reactionBurst.id}-${reactionBurst.emoji}`}
                burstId={reactionBurst.id}
                emoji={reactionBurst.emoji}
                name={reactionBurst.name}
                userId={reactionBurst.userId}
                avatarFace={reactionBurst.avatarFace}
                onDone={() => onReactionBurstDone?.()}
              />
            ) : null}
          </View>

          {hasActivity(video) ? (
            <Pressable
              onPress={onViewers}
              accessibilityLabel="Watchers and reactions"
              className="absolute bottom-1.5 right-1.5 h-10 flex-row items-center justify-center gap-1 rounded-xl px-2"
              style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            >
              <Icons.Eye size={16} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>
                {video.watchCount || 0}
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={onReact}
            accessibilityLabel="React to video"
            className="absolute bottom-1.5 left-1/2 h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: "rgba(0,0,0,0.6)", marginLeft: -20 }}
          >
            {myReaction ? (
              <Text style={{ fontSize: 18 }}>{myReaction}</Text>
            ) : (
              <Icons.Smile size={16} color="#fff" />
            )}
          </Pressable>

          {video.addedById === me || isHost ? (
            <Pressable
              onPress={onRemove}
              accessibilityLabel="Remove video"
              className="absolute bottom-1.5 left-1.5 h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            >
              <Icons.Trash2 size={16} color="#fff" />
            </Pressable>
          ) : null}
        </View>
      </Pressable>

      <View className="px-2 pb-2 pt-1.5">
        <Text numberOfLines={2} style={{ fontSize: 12, fontWeight: "800", lineHeight: 15 }}>
          {video.title}
        </Text>
        <ReactionChips reactions={video.reactions} onPress={onViewers} />
        <View className="mt-1 flex-row items-center gap-1.5">
          {adder.name ? (
            <Avatar
              id={adder.id}
              name={adder.name}
              color={adder.color}
              faceIndex={adder.avatarFace}
              sm
            />
          ) : null}
          <View className="min-w-0 flex-1">
            <Text className="text-text2" numberOfLines={1} style={{ fontSize: 11, fontWeight: "700" }}>
              {memberLabel(adder)}
            </Text>
            {video.createdAt ? (
              <Text className="text-text3" style={{ fontSize: 10, fontWeight: "700" }}>
                {formatAddedDate(video.createdAt)}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </Card>
  );
}
