"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { trpc } from "@reelparty/api";
import {
  detectPlatform,
  normalizeClipboardText,
  queueAdders,
  resolveMember,
  rid,
  sortMembersForDisplay,
  sortQueue,
  type PartyView,
  type QueueItem,
  type QueueSortId,
  type Reactions,
  type SortDir,
} from "@reelparty/shared";
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

  // Hydrate persisted session + filters when the code changes.
  useEffect(() => {
    if (!code) return;
    void session.loadSession().then((s) => {
      if (s?.code === code && s.watchingVideoId) setMyWatchingId(s.watchingVideoId);
    });
    void session.loadQueueFilters(code).then((f) => {
      setHideWatched(f.hideWatched);
      setFilterUserId(f.filterUserId);
    });
  }, [code, session]);

  useEffect(() => {
    if (code) void session.saveSession(code, myWatchingId ?? undefined);
  }, [code, myWatchingId, session]);

  useEffect(() => {
    if (code) void session.saveQueueFilters(code, { hideWatched, filterUserId });
  }, [code, hideWatched, filterUserId, session]);

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
    async (raw: string) => {
      if (!me || !party) return;
      const det = detectPlatform(normalizeClipboardText(raw));
      if (!det) {
        toast("That's not a TikTok, Reels, or Shorts link 🙈");
        return;
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
        const t = meta.title.slice(0, 28);
        toast(`Added "${t}${meta.title.length > 28 ? "…" : ""}"`);
      } catch {
        toast("Couldn't add that video");
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
      bridge.openVideo(video.url);
      try {
        await playMut.mutateAsync({ code, videoId: video.id, userId: me });
        await invalidate();
      } catch {
        /* poll will reconcile */
      }
    },
    [me, code, session, bridge, playMut, invalidate],
  );

  const setReaction = useCallback(
    async (video: QueueItem, reaction: string) => {
      if (!me) return;
      const prev = video.reactions?.[me] || null;
      const removing = prev === reaction;
      const next: Reactions = { ...(video.reactions || {}) };
      if (removing) delete next[me];
      else next[me] = reaction;
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
    [me, code, reactMut, patchQueueItem, toast],
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
        if (video.id === myWatchingId) setMyWatchingId(null);
        await invalidate();
        toast("Removed from queue");
      } catch {
        toast("Couldn't remove video");
      }
    },
    [me, code, removeMut, myWatchingId, invalidate, toast],
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
      text: `Party code ${party.code} — watch TikToks, Reels & Shorts together`,
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

  const mySpot = party?.queue.find((q) => q.id === myWatchingId) ?? null;
  const nowPlaying =
    party?.queue.find((q) => q.id === party.nowPlayingId) ?? null;

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
    mySpot,
    nowPlaying,
    // filter state
    hideWatched,
    setHideWatched,
    filterUserId,
    setFilterUserId,
    queueSort,
    setQueueSort,
    queueSortDir,
    setQueueSortDir,
    myWatchingId,
    // actions
    addVideo,
    playVideo,
    setReaction,
    unwatchVideo,
    removeVideo,
    kickMember,
    leave,
    shareInvite,
    resolveMember: (memberId: string, video?: QueueItem) =>
      resolveMember(party, memberId, video),
  };
}

export type PartyRoom = ReturnType<typeof usePartyRoom>;
