"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
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
import { useApp, useToast, useToastDismiss } from "../../provider";
import { PartyHeader } from "./PartyHeader";
import { MembersPill } from "./MembersPill";
import { QueueControls } from "./QueueControls";
import { QueueCard } from "./QueueCard";
import { AddSheet } from "./AddSheet";
import { ReactionPicker } from "./ReactionPicker";
import { ViewersSheet } from "./ViewersSheet";
import { Sheet } from "../../components/Sheet";
import { SheetHeader } from "../../components/SheetHeader";
import { SpotFadeWrap } from "./SpotFadeWrap";
import { CaughtUpConfetti } from "./CaughtUpConfetti";
import { CaughtUpEmojiPop } from "./CaughtUpEmojiPop";

const SPOT_DISMISS_BEAT_MS = 500;
const CAUGHT_UP_CONFETTI_MS = 2200;

function HideWatchedPill({
  active,
  onPress,
}: {
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={active ? "Show watched videos" : "Hide watched videos"}
      className="flex-row items-center gap-1.5 rounded-full border-2 px-2.5 py-1.5"
      style={{
        borderColor: active ? "#1cb0f6" : "#2a2a38",
        backgroundColor: active ? "#1cb0f622" : "#1c1c26",
      }}
    >
      {active ? (
        <Icons.EyeOff size={14} color="#1cb0f6" />
      ) : (
        <Icons.Eye size={14} color="#9898a8" />
      )}
      <Text style={{ fontSize: 12, fontWeight: "800", color: active ? "#1cb0f6" : "#9898a8" }}>
        Hide watched
      </Text>
    </Pressable>
  );
}

export function PartyScreen({ code }: { code: string }) {
  const room = usePartyRoom(code);
  const { bridge } = useApp();
  const toast = useToast();
  const dismissToast = useToastDismiss();
  const [addOpen, setAddOpen] = useState(false);
  const [addPrefill, setAddPrefill] = useState("");
  const [reactVideo, setReactVideo] = useState<QueueItem | null>(null);
  const [viewersVideo, setViewersVideo] = useState<QueueItem | null>(null);
  const [deleteVideo, setDeleteVideo] = useState<QueueItem | null>(null);
  const [spotDismissing, setSpotDismissing] = useState(false);
  const [spotFading, setSpotFading] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const dismissTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const prevCaughtUpRef = useRef<boolean | null>(null);

  const { party, me, spotPinsQueue, clearMySpot } = room;

  const isCaughtUp =
    !!party &&
    !!me &&
    party.queue.length > 0 &&
    room.displayedQueue.length === 0 &&
    !room.filterUserId;

  useEffect(() => {
    prevCaughtUpRef.current = null;
  }, [code]);

  useEffect(() => {
    if (prevCaughtUpRef.current === null) {
      prevCaughtUpRef.current = isCaughtUp;
      return;
    }
    if (isCaughtUp && !prevCaughtUpRef.current) {
      setConfetti(true);
      const timer = setTimeout(() => setConfetti(false), CAUGHT_UP_CONFETTI_MS);
      prevCaughtUpRef.current = isCaughtUp;
      return () => clearTimeout(timer);
    }
    prevCaughtUpRef.current = isCaughtUp;
  }, [isCaughtUp]);

  const completeSpotDismiss = useCallback(() => {
    void clearMySpot();
    setSpotDismissing(false);
    setSpotFading(false);
  }, [clearMySpot]);

  useEffect(
    () => () => {
      dismissTimersRef.current.forEach((id) => clearTimeout(id));
      dismissTimersRef.current = [];
    },
    [],
  );

  const dismissMySpot = useCallback(() => {
    if (spotDismissing || !spotPinsQueue) return;
    setSpotDismissing(true);
    const beatTimer = setTimeout(() => {
      setSpotFading(true);
    }, SPOT_DISMISS_BEAT_MS);
    dismissTimersRef.current = [beatTimer];
  }, [spotDismissing, spotPinsQueue]);

  if (!party || !me) {
    return (
      <Screen>
        <Spinner center />
      </Screen>
    );
  }

  const liveReaction = (v: QueueItem) =>
    party.queue.find((q) => q.id === v.id)?.reactions?.[me] ?? null;

  const myWatchedCount = party.queue.filter(
    (v) => v.watchedBy?.includes(me) && v.id !== room.myWatchingId,
  ).length;
  const hideWatchedHasNothingToHide =
    room.hideWatched && party.queue.length > 0 && myWatchedCount === 0;

  const openAddSheet = () => {
    dismissToast();
    void bridge.readClipboard().then(async (text) => {
      const normalized = normalizeClipboardText(text);
      if (normalized && detectPlatform(normalized)) {
        const ok = await room.addVideo(normalized, { suppressInvalidToast: true });
        if (ok) return;
        setAddPrefill(normalized);
        setAddOpen(true);
        return;
      }
      setAddPrefill(normalized || "");
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
          <View className="mb-2.5 flex-row items-start justify-between gap-2.5">
            <View style={{ gap: 1 }}>
              <Heading style={{ fontSize: 18, lineHeight: 19 }}>The Queue</Heading>
              <Subtle style={{ fontSize: 13, lineHeight: 15, fontWeight: "800" }}>
                {room.displayedQueue.length < party.queue.length
                  ? `${room.displayedQueue.length} of ${party.queue.length} videos`
                  : `${party.queue.length} video${party.queue.length !== 1 ? "s" : ""}`}
              </Subtle>
              {hideWatchedHasNothingToHide ? (
                <Subtle style={{ fontSize: 11, lineHeight: 14, marginTop: 2 }}>
                  No videos watched on this device yet
                </Subtle>
              ) : null}
            </View>
            {party.queue.length > 0 ? (
              <HideWatchedPill
                active={room.hideWatched}
                onPress={() => room.setHideWatched((on) => !on)}
              />
            ) : null}
          </View>

          <QueueControls
            queueLength={party.queue.length}
            adders={room.adders}
            me={me}
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
            <View className="items-center px-2.5 py-10" style={{ overflow: "visible" }}>
              {room.filterUserId ? (
                <>
                  <Text style={{ fontSize: 46 }}>🔍</Text>
                  <Subtle className="mt-1.5" style={{ fontWeight: "800" }}>
                    No videos from this person
                  </Subtle>
                </>
              ) : (
                <>
                  <View
                    style={{
                      position: "relative",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "visible",
                      minWidth: 88,
                      minHeight: 64,
                    }}
                  >
                    <CaughtUpConfetti active={confetti} />
                    <CaughtUpEmojiPop animate={confetti}>🎉</CaughtUpEmojiPop>
                  </View>
                  <Subtle className="mt-1.5" style={{ fontWeight: "800" }}>
                    All caught up!
                  </Subtle>
                </>
              )}
            </View>
          ) : (
            <Pressable
              onPress={
                spotPinsQueue && !spotDismissing ? dismissMySpot : undefined
              }
              disabled={!spotPinsQueue || spotDismissing}
              style={{
                marginTop: 16,
                minHeight: spotPinsQueue ? 400 : undefined,
              }}
            >
              <View className="flex-row flex-wrap justify-between">
                {room.displayedQueue.map((v) => {
                  const isMySpot = v.id === room.myWatchingId;
                  const reactionBurst = room.activeReactionBursts[v.id];
                  const card = (
                    <QueueCard
                      video={v}
                      adder={room.resolveMember(v.addedById, v)}
                      me={me}
                      isHost={room.isHost}
                      isMySpot={isMySpot}
                      showAsMySpot={isMySpot && !spotDismissing}
                      iWatched={v.watchedBy?.includes(me) ?? false}
                      myReaction={liveReaction(v)}
                      reactionBurst={reactionBurst}
                      onReactionBurstDone={() =>
                        room.completeReactionBurst(v.id, reactionBurst?.id ?? 0)
                      }
                      onPlay={() => room.playVideo(v)}
                      onReact={() => setReactVideo(v)}
                      onRemove={() => setDeleteVideo(v)}
                      onUnwatch={() => room.unwatchVideo(v)}
                      onViewers={() => setViewersVideo(v)}
                    />
                  );
                  return (
                    <View key={v.id} style={{ width: "48%", marginBottom: 16 }}>
                      <SpotFadeWrap
                        wrap={spotDismissing && isMySpot}
                        fading={spotFading && isMySpot}
                        onFadeComplete={completeSpotDismiss}
                      >
                        {card}
                      </SpotFadeWrap>
                    </View>
                  );
                })}
              </View>
            </Pressable>
          )}
        </ScrollView>

        <View className="absolute bottom-6 right-5">
          <Button tone="green" loading={room.adding} onPress={openAddSheet}>
            {room.adding ? (
              <Spinner size="small" color="#fff" />
            ) : (
              <>
                <Icons.Plus size={22} color="#fff" />
                <ButtonText>ADD VIDEO</ButtonText>
              </>
            )}
          </Button>
        </View>
      </Screen>

      <AddSheet
        open={addOpen}
        adding={room.adding}
        prefill={addPrefill}
        onClose={() => setAddOpen(false)}
        onSubmit={async (url) => {
          const ok = await room.addVideo(url);
          if (ok) setAddOpen(false);
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
        <SheetHeader>
          <Icons.Trash2 size={32} color="#ff4b4b" />
          <Heading className="mt-2" style={{ fontSize: 20 }}>
            Remove from queue?
          </Heading>
          <Muted className="mt-2 text-center text-[13px]">
            This video will be removed from the party queue.
          </Muted>
        </SheetHeader>
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
