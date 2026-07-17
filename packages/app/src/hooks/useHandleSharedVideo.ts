"use client";

import { useCallback } from "react";
import { trpc } from "@reelparty/api";
import {
  detectPlatform,
  normalizeClipboardText,
  pickAddVideoToast,
  rid,
} from "@reelparty/shared";
import { useApp, useToast } from "../provider";
import { useAppNavigation } from "../navigation/useAppNavigation";

/**
 * Handle a video link shared into the app from another app's share sheet
 * (TikTok, Instagram, YouTube, Facebook). Adds it to the party saved in the
 * device session and lands the user in that party — or routes home with an
 * explanatory toast when that's not possible.
 */
export function useHandleSharedVideo() {
  const { session } = useApp();
  const toast = useToast();
  const nav = useAppNavigation();
  const utils = trpc.useUtils();
  const addMut = trpc.queue.add.useMutation();

  return useCallback(
    async (raw: string) => {
      const s = await session.loadSession();

      const det = detectPlatform(normalizeClipboardText(raw));
      if (!det) {
        toast("That's not a TikTok, Reels, Facebook, or Shorts link 🙈");
        if (s?.code) nav.goParty(s.code);
        else nav.goHome();
        return;
      }

      if (!s?.code) {
        toast("Join a party first, then share the video again 🎬");
        nav.goHome();
        return;
      }

      const me = await session.getUserId();

      let party = null;
      try {
        party = await utils.party.full.fetch({ code: s.code });
      } catch {
        /* treated as a dead party below */
      }
      const member = party?.members.find((m) => m.id === me);
      if (!party || !member) {
        await session.saveSession(null);
        toast("That party has ended — join a new one first");
        nav.goHome();
        return;
      }

      try {
        const meta = await utils.meta.fetch.fetch({ url: det.url });
        const storedUrl = meta.url || det.url;
        const videoId =
          det.videoId || storedUrl.match(/\/video\/(\d+)/)?.[1] || null;
        await addMut.mutateAsync({
          id: rid(),
          partyCode: s.code,
          url: storedUrl,
          platform: det.platform,
          videoId,
          title: meta.title,
          creator: meta.creator,
          thumbnail: meta.thumbnail,
          addedById: me,
          addedByName: member.name || "Someone",
          position: party.queue.length,
        });
        await utils.party.full.invalidate({ code: s.code });
        toast(pickAddVideoToast());
      } catch {
        toast("Couldn't add that video");
      }
      nav.goParty(s.code);
    },
    [session, toast, nav, utils, addMut],
  );
}
