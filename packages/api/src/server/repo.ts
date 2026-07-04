import { TRPCError } from "@trpc/server";
import type { UpdateFilter } from "mongodb";
import { avatarColorFor, avatarIndexFor, isValidReaction } from "@reelparty/shared";
import type {
  AddVideoInput,
  CreatePartyInput,
  JoinPartyInput,
  Member,
  PartyView,
  PlayVideoInput,
  QueueItem,
  ReactInput,
  RemoveMemberInput,
  VideoActionInput,
} from "../types";
import { getDb } from "./db";
import {
  mapMember,
  mapParty,
  mapVideo,
  type MemberRow,
  type PartyRow,
  type QueueRow,
} from "./mappers";

const nowIso = () => new Date().toISOString();

export async function getParty(code: string) {
  const db = await getDb();
  const row = await db.collection<PartyRow>("parties").findOne({ code });
  return mapParty(row);
}

export async function getMembers(code: string): Promise<Member[]> {
  const db = await getDb();
  const rows = await db
    .collection<MemberRow>("members")
    .find({ party_code: code })
    .sort({ joined_at: 1 })
    .toArray();
  return rows.map(mapMember);
}

export async function getQueue(code: string): Promise<QueueItem[]> {
  const db = await getDb();
  const rows = await db
    .collection<QueueRow>("queue_items")
    .find({ party_code: code })
    .sort({ created_at: 1, position: 1 })
    .toArray();
  return rows.map(mapVideo);
}

/** Hydrated party (party + members + queue) in one round-trip-ish call. */
export async function getPartyView(code: string): Promise<PartyView | null> {
  const [party, members, queue] = await Promise.all([
    getParty(code),
    getMembers(code),
    getQueue(code),
  ]);
  if (!party) return null;
  return { ...party, members, queue };
}

export async function getMemberCount(code: string): Promise<number> {
  const db = await getDb();
  return db.collection("members").countDocuments({ party_code: code });
}

export async function createParty(input: CreatePartyInput): Promise<void> {
  const db = await getDb();
  const now = nowIso();
  await db.collection("parties").insertOne({
    code: input.code,
    host_id: input.hostId,
    host_name: input.hostName,
    now_playing_id: null,
    created_at: now,
  });
  await db.collection("members").updateOne(
    { id: input.hostId, party_code: input.code },
    {
      $set: {
        id: input.hostId,
        party_code: input.code,
        name: input.hostName,
        color: avatarColorFor(input.hostId),
        avatar_face: avatarIndexFor(input.hostId),
      },
      $setOnInsert: { joined_at: now },
    },
    { upsert: true },
  );
}

export async function joinParty(input: JoinPartyInput): Promise<void> {
  const db = await getDb();
  await db.collection("members").updateOne(
    { id: input.id, party_code: input.code },
    {
      $set: {
        id: input.id,
        party_code: input.code,
        name: input.name,
        color: avatarColorFor(input.id),
        avatar_face: avatarIndexFor(input.id),
      },
      $setOnInsert: { joined_at: nowIso() },
    },
    { upsert: true },
  );
}

export async function removeMember(input: RemoveMemberInput): Promise<void> {
  const db = await getDb();
  const party = await db
    .collection<PartyRow>("parties")
    .findOne({ code: input.code });
  if (!party) throw new TRPCError({ code: "NOT_FOUND", message: "Party not found" });
  if (party.host_id !== input.hostId)
    throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
  if (input.memberId === party.host_id)
    throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot remove host" });

  const result = await db
    .collection("members")
    .deleteOne({ id: input.memberId, party_code: input.code });
  if (result.deletedCount === 0)
    throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });
}

export async function addVideo(input: AddVideoInput): Promise<void> {
  const db = await getDb();
  await db.collection("queue_items").insertOne({
    id: input.id,
    party_code: input.partyCode,
    url: input.url,
    platform: input.platform,
    video_id: input.videoId,
    title: input.title,
    creator: input.creator,
    thumbnail: input.thumbnail,
    added_by_id: input.addedById,
    added_by_name: input.addedByName,
    watched_by: input.addedById ? [input.addedById] : [],
    reactions: {},
    position: input.position,
    created_at: nowIso(),
  });
}

export async function removeVideo(input: VideoActionInput): Promise<void> {
  const db = await getDb();
  const item = await db
    .collection<QueueRow>("queue_items")
    .findOne({ id: input.videoId, party_code: input.partyCode });
  if (!item)
    throw new TRPCError({ code: "NOT_FOUND", message: "Video not found" });
  const party = await db
    .collection<PartyRow>("parties")
    .findOne({ code: input.partyCode });
  if (!party)
    throw new TRPCError({ code: "NOT_FOUND", message: "Party not found" });
  if (item.added_by_id !== input.userId && party.host_id !== input.userId)
    throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });

  await db.collection("queue_items").deleteOne({ id: input.videoId });
  if (party.now_playing_id === input.videoId) {
    await db
      .collection("parties")
      .updateOne({ code: input.partyCode }, { $set: { now_playing_id: null } });
  }
}

export async function playVideo(input: PlayVideoInput): Promise<void> {
  const db = await getDb();
  await Promise.all([
    db
      .collection("parties")
      .updateOne({ code: input.code }, { $set: { now_playing_id: input.videoId } }),
    db
      .collection("queue_items")
      .updateOne({ id: input.videoId }, { $addToSet: { watched_by: input.userId } }),
  ]);
}

export async function unwatchVideo(input: VideoActionInput): Promise<void> {
  const db = await getDb();
  const item = await db
    .collection<QueueRow>("queue_items")
    .findOne({ id: input.videoId, party_code: input.partyCode });
  if (!item)
    throw new TRPCError({ code: "NOT_FOUND", message: "Video not found" });

  await db.collection<QueueRow>("queue_items").updateOne(
    { id: input.videoId },
    {
      $pull: { watched_by: input.userId },
      $unset: { [`reactions.${input.userId}`]: "" },
    } as UpdateFilter<QueueRow>,
  );
}

export async function reactToVideo(input: ReactInput): Promise<void> {
  if (!isValidReaction(input.reaction))
    throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid reaction" });
  const db = await getDb();
  const item = await db
    .collection<QueueRow>("queue_items")
    .findOne({ id: input.videoId, party_code: input.partyCode });
  if (!item)
    throw new TRPCError({ code: "NOT_FOUND", message: "Video not found" });

  const field = `reactions.${input.userId}`;
  if (item.reactions?.[input.userId] === input.reaction) {
    await db
      .collection("queue_items")
      .updateOne({ id: input.videoId }, { $unset: { [field]: "" } });
  } else {
    await db
      .collection("queue_items")
      .updateOne({ id: input.videoId }, { $set: { [field]: input.reaction } });
  }
}

/** Context used by the SEO invite page + OG image. */
export async function partyInviteContext(code: string) {
  const party = await getParty(code);
  if (!party) return null;
  const memberCount = await getMemberCount(code);
  return { hostName: party.hostName || "Someone", code, memberCount };
}
