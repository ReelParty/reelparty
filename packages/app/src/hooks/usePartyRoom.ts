"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@reelparty/api";
import {
  detectPlatform,
  normalizeClipboardText,
  pickAddVideoToast,
  queueAdders,
  resolveMember,
  rid,
  avatarIndexFor,
  sortMembersForDisplay,
  sortQueue,
  type PartyView,
  type QueueItem,
  type QueueSortId,
  type Reactions,
  type SortDir,
} from "@reelparty/shared";
import {
  REACTION_BURST_MS,
  type ReactionBurstPayload,
} from "../features/party/reactionBurstParticles";
import { useApp, useToast } from "../provider";
import { inviteUrl } from "../platform/bridge";
import { useAppNavigation } from "../navigation/useAppNavigation";
import { useUserId } from "./useUserId";

export function usePartyRoom(code: string) {
  const me = useUserId();
  const { session, bridge } = useApp();
  const toast = useToast();
  const nav = useAppNavigation();
  const utils = trpc.useUtils();

  const partyQuery = trpc.party.full.useQuery(
    { code },
    { enabled: !!code, refetchInterval: 2000 },
  );
  const party: PartyView | null = partyQuery.data ?? null;

  const [hideWatched, setHideWatched] = useState(false);
  const [filterUserId, setFilterUserId] = useState<string | null>(null);
  const [queueSort, setQueueSort] = useState<QueueSortId>("added");
  const [queueSortDir, setQueueSortDir] = useState<SortDir>("asc");
  const [myWatchingId, setMyWatchingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [filtersHydrated, setFiltersHydrated] = useState(false);
  const userChangedFiltersRef = useRef(false);
  const [activeReactionBursts, setActiveReactionBursts] = useState<
    Record<string, ReactionBurstPayload>
  >({});
  const burstIdRef = useRef(0);
  const prevReactionsRef = useRef<Record<string, Record<string, string>>>({});
  const recentBurstsRef = useRef<Record<string, number>>({});
  const reactionsInitRef = useRef(false);

  // Hydrate persisted session + filters when the code changes.
  useEffect(() => {
    if (!code) return;
    let active = true;
    userChangedFiltersRef.current = false;
    setFiltersHydrated(false);

    void session.loadSession().then((s) => {
      if (!active) return;
      if (s?.code === code && s.watchingVideoId) setMyWatchingId(s.watchingVideoId);
    });

    void session.loadQueueFilters(code).then((f) => {
      if (!active) return;
      if (!userChangedFiltersRef.current) {
        setHideWatched(f.hideWatched);
        setFilterUserId(f.filterUserId);
      }
      setFiltersHydrated(true);
    });

    return () => {
      active = false;
    };
  }, [code, session]);

  useEffect(() => {
    reactionsInitRef.current = false;
    prevReactionsRef.current = {};
    recentBurstsRef.current = {};
    setActiveReactionBursts({});
  }, [code]);

  const completeReactionBurst = useCallback((videoId: string, burstId: number) => {
    setActiveReactionBursts((active) => {
      if (active[videoId]?.id !== burstId) return active;
      const updated = { ...active };
      delete updated[videoId];
      return updated;
    });
  }, []);

  const spawnReactionBurst = useCallback(
    (
      videoId: string,
      emoji: string,
      member: { id: string; name: string; color: string; avatarFace?: number },
    ) => {
      if (!emoji || !member.name) return;
      const dedupKey = `${videoId}:${member.id}:${emoji}`;
      const now = Date.now();
      if (now - (recentBurstsRef.current[dedupKey] ?? 0) < REACTION_BURST_MS) return;
      recentBurstsRef.current[dedupKey] = now;

      setActiveReactionBursts((active) => ({
        ...active,
        [videoId]: {
          id: ++burstIdRef.current,
          emoji,
          name: member.name,
          color: member.color,
          userId: member.id,
          avatarFace: member.avatarFace ?? avatarIndexFor(member.id),
        },
      }));
    },
    [],
  );

  const syncPrevReaction = useCallback(
    (videoId: string, userId: string, emoji: string | null) => {
      if (!prevReactionsRef.current[videoId]) prevReactionsRef.current[videoId] = {};
      if (emoji) prevReactionsRef.current[videoId][userId] = emoji;
      else delete prevReactionsRef.current[videoId][userId];
    },
    [],
  );

  useEffect(() => {
    if (!party?.queue || !party.members) return;

    if (!reactionsInitRef.current) {
      prevReactionsRef.current = Object.fromEntries(
        party.queue.map((v) => [v.id, { ...(v.reactions || {}) }]),
      );
      reactionsInitRef.current = true;
      return;
    }

    party.queue.forEach((v) => {
      const prev = prevReactionsRef.current[v.id] || {};
      const curr = v.reactions || {};
      Object.entries(curr).forEach(([userId, emoji]) => {
        if (prev[userId] === emoji) return;
        const member = resolveMember(party, userId, v);
        spawnReactionBurst(v.id, emoji, member);
      });
    });

    prevReactionsRef.current = Object.fromEntries(
      party.queue.map((v) => [v.id, { ...(v.reactions || {}) }]),
    );
  }, [party, me, spawnReactionBurst]);

  const setHideWatchedTracked = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      userChangedFiltersRef.current = true;
      setHideWatched(value);
    },
    [],
  );

  const setFilterUserIdTracked = useCallback(
    (value: string | null | ((prev: string | null) => string | null)) => {
      userChangedFiltersRef.current = true;
      setFilterUserId(value);
    },
    [],
  );

  useEffect(() => {
    if (code && myWatchingId) void session.saveSession(code, myWatchingId);
  }, [code, myWatchingId, session]);

  useEffect(() => {
    if (!code || !filtersHydrated) return;
    void session.saveQueueFilters(code, { hideWatched, filterUserId });
  }, [code, hideWatched, filterUserId, session, filtersHydrated]);

  // Kicked out / party gone → bail to home.
  useEffect(() => {
    if (!party || !me) return;
    if (!party.members.some((m) => m.id === me)) {
      toast("You were removed from the party");
      void session.saveSession(null);
      nav.goHome();
    }
  }, [party, me, toast, session, nav]);

  const invalidate = useCallback(
    () => utils.party.full.invalidate({ code }),
    [utils, code],
  );

  const addMut = trpc.queue.add.useMutation();
  const playMut = trpc.party.play.useMutation();
  const reactMut = trpc.queue.react.useMutation();
  const unwatchMut = trpc.queue.unwatch.useMutation();
  const removeMut = trpc.queue.remove.useMutation();
  const kickMut = trpc.party.removeMember.useMutation();

  const patchQueueItem = useCallback(
    (videoId: string, patch: (v: QueueItem) => QueueItem) => {
      utils.party.full.setData({ code }, (prev) =>
        prev
          ? {
              ...prev,
              queue: prev.queue.map((v) => (v.id === videoId ? patch(v) : v)),
            }
          : prev,
      );
    },
    [utils, code],
  );

  /* ----------------------------- actions ----------------------------- */

  const addVideo = useCallback(
    async (
      raw: string,
      opts?: { suppressInvalidToast?: boolean },
    ): Promise<boolean> => {
      if (!me || !party) return false;
      const det = detectPlatform(normalizeClipboardText(raw));
      if (!det) {
        if (!opts?.suppressInvalidToast) {
          toast("That's not a TikTok, Reels, Facebook, or Shorts link 🙈");
        }
        return false;
      }
      setAdding(true);
      try {
        const meta = await utils.meta.fetch.fetch({ url: det.url });
        const storedUrl = meta.url || det.url;
        const videoId =
          det.videoId || storedUrl.match(/\/video\/(\d+)/)?.[1] || null;
        const myName =
          party.members.find((m) => m.id === me)?.name || "Someone";
        await addMut.mutateAsync({
          id: rid(),
          partyCode: code,
          url: storedUrl,
          platform: det.platform,
          videoId,
          title: meta.title,
          creator: meta.creator,
          thumbnail: meta.thumbnail,
          addedById: me,
          addedByName: myName,
          position: party.queue.length,
        });
        await invalidate();
        toast(pickAddVideoToast());
        return true;
      } catch {
        toast("Couldn't add that video");
        return false;
      } finally {
        setAdding(false);
      }
    },
    [me, party, code, addMut, utils, invalidate, toast],
  );

  const playVideo = useCallback(
    async (video: QueueItem) => {
      if (!me) return;
      setMyWatchingId(video.id);
      await session.saveSession(code, video.id);
      patchQueueItem(video.id, (v) => {
        if (v.watchedBy.includes(me)) return v;
        const watchedBy = [...v.watchedBy, me];
        return { ...v, watchedBy, watchCount: watchedBy.length };
      });
      bridge.openVideo(video.url);
      try {
        await playMut.mutateAsync({ code, videoId: video.id, userId: me });
        await invalidate();
      } catch {
        /* poll will reconcile */
      }
    },
    [me, code, session, bridge, playMut, invalidate, patchQueueItem],
  );

  const setReaction = useCallback(
    async (video: QueueItem, reaction: string) => {
      if (!me) return;
      const prev = video.reactions?.[me] || null;
      const removing = prev === reaction;
      const next: Reactions = { ...(video.reactions || {}) };
      if (removing) delete next[me];
      else next[me] = reaction;

      if (!removing) {
        syncPrevReaction(video.id, me, reaction);
        const member = party?.members.find((m) => m.id === me);
        if (member) spawnReactionBurst(video.id, reaction, member);
      } else {
        syncPrevReaction(video.id, me, null);
      }

      patchQueueItem(video.id, (v) => ({ ...v, reactions: next }));
      try {
        await reactMut.mutateAsync({
          partyCode: code,
          videoId: video.id,
          userId: me,
          reaction,
        });
      } catch {
        patchQueueItem(video.id, (v) => ({
          ...v,
          reactions: video.reactions || {},
        }));
        toast("Couldn't save reaction");
      }
    },
    [me, party, code, reactMut, patchQueueItem, toast, syncPrevReaction, spawnReactionBurst],
  );

  const unwatchVideo = useCallback(
    async (video: QueueItem) => {
      if (!me) return;
      patchQueueItem(video.id, (v) => {
        const watchedBy = v.watchedBy.filter((id) => id !== me);
        const reactions = { ...(v.reactions || {}) };
        delete reactions[me];
        return { ...v, watchedBy, watchCount: watchedBy.length, reactions };
      });
      try {
        await unwatchMut.mutateAsync({
          partyCode: code,
          videoId: video.id,
          userId: me,
        });
        toast("Marked unwatched");
      } catch {
        await invalidate();
        toast("Couldn't update watch status");
      }
    },
    [me, code, unwatchMut, patchQueueItem, invalidate, toast],
  );

  const removeVideo = useCallback(
    async (video: QueueItem) => {
      if (!me) return;
      try {
        await removeMut.mutateAsync({
          partyCode: code,
          videoId: video.id,
          userId: me,
        });
        if (video.id === myWatchingId) {
          setMyWatchingId(null);
          await session.saveSession(code, null);
        }
        await invalidate();
        toast("Removed from queue");
      } catch {
        toast("Couldn't remove video");
      }
    },
    [me, code, removeMut, myWatchingId, invalidate, toast, session],
  );

  const kickMember = useCallback(
    async (memberId: string) => {
      if (!me) return;
      try {
        await kickMut.mutateAsync({ code, memberId, hostId: me });
        await invalidate();
        toast("User removed");
      } catch {
        toast("Couldn't remove user");
      }
    },
    [me, code, kickMut, invalidate, toast],
  );

  const leave = useCallback(() => {
    void session.saveSession(null);
    setMyWatchingId(null);
    nav.goHome();
  }, [session, nav]);

  const shareInvite = useCallback(async () => {
    if (!party) return;
    const link = inviteUrl(bridge, party.code);
    const hostName =
      party.members.find((m) => m.id === party.hostId)?.name ||
      party.hostName ||
      "Someone";
    const shared = await bridge.share({
      title: `Join ${hostName}'s ReelParty 🎬`,
      text: `Party code ${party.code} — watch TikToks, Reels, Facebook & Shorts together`,
      url: link,
    });
    if (!shared) {
      const copied = await bridge.copy(link);
      toast(copied ? "Invite link copied! 📋" : "Couldn't copy invite link");
    }
  }, [party, bridge, toast]);

  /* ---------------------------- derived ----------------------------- */

  const isHost = !!party && !!me && party.hostId === me;

  const sortedMembers = useMemo(
    () => (party && me ? sortMembersForDisplay(party.members, me, party.hostId) : []),
    [party, me],
  );
  const adders = useMemo(
    () => (party && me ? queueAdders(party, me) : []),
    [party, me],
  );

  const displayedQueue = useMemo(() => {
    if (!party || !me) return [];
    const filtered = party.queue.filter((v) => {
      if (hideWatched && v.watchedBy?.includes(me) && v.id !== myWatchingId)
        return false;
      if (filterUserId && v.addedById !== filterUserId) return false;
      return true;
    });
    return sortQueue(filtered, queueSort, queueSortDir);
  }, [party, me, hideWatched, filterUserId, myWatchingId, queueSort, queueSortDir]);

  const queueWithoutSpotPin = useMemo(() => {
    if (!party || !me) return [];
    return party.queue.filter((v) => {
      if (hideWatched && v.watchedBy?.includes(me)) return false;
      if (filterUserId && v.addedById !== filterUserId) return false;
      return true;
    });
  }, [party, me, hideWatched, filterUserId]);

  const spotPinsQueue =
    hideWatched &&
    !!myWatchingId &&
    queueWithoutSpotPin.length === 0 &&
    displayedQueue.length === 1 &&
    displayedQueue[0]?.id === myWatchingId;

  const mySpot = party?.queue.find((q) => q.id === myWatchingId) ?? null;
  const nowPlaying =
    party?.queue.find((q) => q.id === party.nowPlayingId) ?? null;

  const clearMySpot = useCallback(async () => {
    setMyWatchingId(null);
    await session.saveSession(code, null);
  }, [code, session]);

  return {
    me,
    party,
    isLoading: partyQuery.isLoading,
    isHost,
    adding,
    // derived
    sortedMembers,
    adders,
    displayedQueue,
    queueWithoutSpotPin,
    spotPinsQueue,
    mySpot,
    nowPlaying,
    // filter state
    hideWatched,
    setHideWatched: setHideWatchedTracked,
    filterUserId,
    setFilterUserId: setFilterUserIdTracked,
    queueSort,
    setQueueSort,
    queueSortDir,
    setQueueSortDir,
    myWatchingId,
    activeReactionBursts,
    // actions
    addVideo,
    playVideo,
    setReaction,
    unwatchVideo,
    removeVideo,
    kickMember,
    leave,
    shareInvite,
    clearMySpot,
    completeReactionBurst,
    resolveMember: (memberId: string, video?: QueueItem) =>
      resolveMember(party, memberId, video),
  };
}

export type PartyRoom = ReturnType<typeof usePartyRoom>;
