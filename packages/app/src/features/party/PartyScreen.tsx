"use client";

import { useState } from "react";
import { ScrollView, View } from "react-native";
import {
  Button,
  ButtonText,
  Heading,
  Icons,
  Muted,
  Screen,
  Spinner,
  Subtle,
  Text,
} from "@reelparty/ui";
import type { QueueItem } from "@reelparty/shared";
import { detectPlatform, normalizeClipboardText } from "@reelparty/shared";
import { usePartyRoom } from "../../hooks/usePartyRoom";
import { useApp, useToast } from "../../provider";
import { PartyHeader } from "./PartyHeader";
import { MembersPill } from "./MembersPill";
import { QueueControls } from "./QueueControls";
import { QueueCard } from "./QueueCard";
import { AddSheet } from "./AddSheet";
import { ReactionPicker } from "./ReactionPicker";
import { ViewersSheet } from "./ViewersSheet";
import { Sheet } from "../../components/Sheet";

export function PartyScreen({ code }: { code: string }) {
  const room = usePartyRoom(code);
  const { bridge } = useApp();
  const toast = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [addPrefill, setAddPrefill] = useState("");
  const [reactVideo, setReactVideo] = useState<QueueItem | null>(null);
  const [viewersVideo, setViewersVideo] = useState<QueueItem | null>(null);
  const [deleteVideo, setDeleteVideo] = useState<QueueItem | null>(null);

  const { party, me } = room;

  if (!party || !me) {
    return (
      <Screen>
        <Spinner center />
      </Screen>
    );
  }

  const liveReaction = (v: QueueItem) =>
    party.queue.find((q) => q.id === v.id)?.reactions?.[me] ?? null;

  const openAddSheet = () => {
    void bridge.readClipboard().then((text) => {
      const normalized = normalizeClipboardText(text);
      const prefill =
        normalized && detectPlatform(normalized) ? normalized : "";
      setAddPrefill(prefill);
      setAddOpen(true);
    });
  };

  return (
    <>
      <Screen>
        <PartyHeader
          code={party.code}
          onLeave={room.leave}
          onInvite={room.shareInvite}
          onOpenNowPlaying={() =>
            room.nowPlaying
              ? room.playVideo(room.nowPlaying)
              : toast("Nothing playing in the party yet")
          }
        />

        <MembersPill
          members={room.sortedMembers.map((m) => ({ ...m, booted: false }))}
          hostId={party.hostId}
          isHost={room.isHost}
          onKick={room.kickMember}
        />

        <ScrollView
          className="mt-4 flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 96 }}
        >
          <View className="mb-2.5 flex-row items-start justify-between">
            <View>
              <Heading style={{ fontSize: 18 }}>The Queue</Heading>
              <Subtle style={{ fontSize: 13 }}>
                {room.displayedQueue.length < party.queue.length
                  ? `${room.displayedQueue.length} of ${party.queue.length} videos`
                  : `${party.queue.length} video${party.queue.length !== 1 ? "s" : ""}`}
              </Subtle>
            </View>
          </View>

          <QueueControls
            queueLength={party.queue.length}
            adders={room.adders}
            me={me}
            hideWatched={room.hideWatched}
            setHideWatched={room.setHideWatched}
            filterUserId={room.filterUserId}
            setFilterUserId={room.setFilterUserId}
            queueSort={room.queueSort}
            setQueueSort={room.setQueueSort}
            queueSortDir={room.queueSortDir}
            setQueueSortDir={room.setQueueSortDir}
          />

          {party.queue.length === 0 ? (
            <View className="items-center px-2.5 py-10">
              <Text style={{ fontSize: 46 }}>📭</Text>
              <Subtle className="mt-1.5" style={{ fontWeight: "800" }}>
                Queue&apos;s empty!
              </Subtle>
              <Subtle style={{ fontSize: 13 }}>Copy a link, then tap ＋</Subtle>
            </View>
          ) : room.displayedQueue.length === 0 ? (
            <View className="items-center px-2.5 py-10">
              <Text style={{ fontSize: 46 }}>{room.filterUserId ? "🔍" : "🎉"}</Text>
              <Subtle className="mt-1.5" style={{ fontWeight: "800" }}>
                {room.filterUserId ? "No videos from this person" : "All caught up!"}
              </Subtle>
            </View>
          ) : (
            <View className="mt-4 flex-row flex-wrap justify-between">
              {room.displayedQueue.map((v) => (
                <View key={v.id} style={{ width: "48%", marginBottom: 16 }}>
                  <QueueCard
                    video={v}
                    adder={room.resolveMember(v.addedById, v)}
                    me={me}
                    isHost={room.isHost}
                    isMySpot={v.id === room.myWatchingId}
                    iWatched={v.watchedBy?.includes(me) ?? false}
                    myReaction={liveReaction(v)}
                    onPlay={() => room.playVideo(v)}
                    onReact={() => setReactVideo(v)}
                    onRemove={() => setDeleteVideo(v)}
                    onUnwatch={() => room.unwatchVideo(v)}
                    onViewers={() => setViewersVideo(v)}
                  />
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <View className="absolute bottom-6 right-5">
          <Button tone="green" onPress={openAddSheet}>
            <Icons.Plus size={22} color="#fff" />
            <ButtonText>ADD VIDEO</ButtonText>
          </Button>
        </View>
      </Screen>

      <AddSheet
        open={addOpen}
        adding={room.adding}
        prefill={addPrefill}
        onClose={() => setAddOpen(false)}
        onSubmit={async (url) => {
          await room.addVideo(url);
          setAddOpen(false);
        }}
      />

      <ReactionPicker
        open={!!reactVideo}
        current={reactVideo ? liveReaction(reactVideo) : null}
        onPick={(emoji) => {
          if (reactVideo) room.setReaction(reactVideo, emoji);
          setReactVideo(null);
        }}
        onClose={() => setReactVideo(null)}
      />

      <ViewersSheet
        video={viewersVideo}
        party={party}
        resolve={room.resolveMember}
        onClose={() => setViewersVideo(null)}
      />

      <Sheet open={!!deleteVideo} onClose={() => setDeleteVideo(null)}>
        <View className="items-center">
          <Icons.Trash2 size={32} color="#ff4b4b" />
          <Heading className="mt-2" style={{ fontSize: 20 }}>
            Remove from queue?
          </Heading>
          <Muted className="mt-2 text-center text-[13px]">
            This video will be removed from the party queue.
          </Muted>
        </View>
        <View className="mt-4 gap-2.5">
          <Button
            tone="red"
            full
            onPress={() => {
              if (deleteVideo) room.removeVideo(deleteVideo);
              setDeleteVideo(null);
            }}
          >
            <ButtonText>YES, REMOVE</ButtonText>
          </Button>
          <Button tone="gray" full onPress={() => setDeleteVideo(null)}>
            <ButtonText tone="gray">CANCEL</ButtonText>
          </Button>
        </View>
      </Sheet>
    </>
  );
}
