import { TRPCError } from "@trpc/server";
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
  const { rows } = await db.query<PartyRow>(
    `SELECT code, host_id, host_name, now_playing_id FROM parties WHERE code = $1`,
    [code],
  );
  return mapParty(rows[0] ?? null);
}

export async function getMembers(code: string): Promise<Member[]> {
  const db = await getDb();
  const { rows } = await db.query<MemberRow>(
    `SELECT id, name, color, avatar_face, joined_at
       FROM members WHERE party_code = $1
      ORDER BY joined_at ASC`,
    [code],
  );
  return rows.map(mapMember);
}

export async function getQueue(code: string): Promise<QueueItem[]> {
  const db = await getDb();
  const { rows } = await db.query<QueueRow>(
    `SELECT id, url, platform, video_id, title, creator, thumbnail,
            added_by_id, added_by_name, created_at, watched_by, reactions
       FROM queue_items WHERE party_code = $1
      ORDER BY created_at ASC, position ASC`,
    [code],
  );
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
  const { rows } = await db.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM members WHERE party_code = $1`,
    [code],
  );
  return Number(rows[0]?.count ?? 0);
}

const upsertMemberSql = `
  INSERT INTO members (id, party_code, name, color, avatar_face, joined_at)
  VALUES ($1, $2, $3, $4, $5, $6)
  ON CONFLICT (id, party_code) DO UPDATE
    SET name = EXCLUDED.name,
        color = EXCLUDED.color,
        avatar_face = EXCLUDED.avatar_face
`;

export async function createParty(input: CreatePartyInput): Promise<void> {
  const db = await getDb();
  const now = nowIso();
  await db.query(
    `INSERT INTO parties (code, host_id, host_name, now_playing_id, created_at)
     VALUES ($1, $2, $3, NULL, $4)`,
    [input.code, input.hostId, input.hostName, now],
  );
  await db.query(upsertMemberSql, [
    input.hostId,
    input.code,
    input.hostName,
    avatarColorFor(input.hostId),
    avatarIndexFor(input.hostId),
    now,
  ]);
}

export async function joinParty(input: JoinPartyInput): Promise<void> {
  const db = await getDb();
  await db.query(upsertMemberSql, [
    input.id,
    input.code,
    input.name,
    avatarColorFor(input.id),
    avatarIndexFor(input.id),
    nowIso(),
  ]);
}

export async function removeMember(input: RemoveMemberInput): Promise<void> {
  const db = await getDb();
  const { rows } = await db.query<PartyRow>(
    `SELECT code, host_id, host_name, now_playing_id FROM parties WHERE code = $1`,
    [input.code],
  );
  const party = rows[0];
  if (!party) throw new TRPCError({ code: "NOT_FOUND", message: "Party not found" });
  if (party.host_id !== input.hostId)
    throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
  if (input.memberId === party.host_id)
    throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot remove host" });

  const result = await db.query(
    `DELETE FROM members WHERE id = $1 AND party_code = $2`,
    [input.memberId, input.code],
  );
  if (result.rowCount === 0)
    throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });
}

export async function addVideo(input: AddVideoInput): Promise<void> {
  const db = await getDb();
  await db.query(
    `INSERT INTO queue_items
       (id, party_code, url, platform, video_id, title, creator, thumbnail,
        added_by_id, added_by_name, watched_by, reactions, position, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, '{}'::jsonb, $12, $13)`,
    [
      input.id,
      input.partyCode,
      input.url,
      input.platform,
      input.videoId,
      input.title,
      input.creator,
      input.thumbnail,
      input.addedById,
      input.addedByName,
      input.addedById ? [input.addedById] : [],
      input.position,
      nowIso(),
    ],
  );
}

export async function removeVideo(input: VideoActionInput): Promise<void> {
  const db = await getDb();
  const item = await findQueueItem(input.videoId, input.partyCode);
  if (!item)
    throw new TRPCError({ code: "NOT_FOUND", message: "Video not found" });
  const { rows } = await db.query<PartyRow>(
    `SELECT code, host_id, host_name, now_playing_id FROM parties WHERE code = $1`,
    [input.partyCode],
  );
  const party = rows[0];
  if (!party)
    throw new TRPCError({ code: "NOT_FOUND", message: "Party not found" });
  if (item.added_by_id !== input.userId && party.host_id !== input.userId)
    throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });

  await db.query(`DELETE FROM queue_items WHERE id = $1`, [input.videoId]);
  if (party.now_playing_id === input.videoId) {
    await db.query(
      `UPDATE parties SET now_playing_id = NULL WHERE code = $1`,
      [input.partyCode],
    );
  }
}

export async function playVideo(input: PlayVideoInput): Promise<void> {
  const db = await getDb();
  await Promise.all([
    db.query(`UPDATE parties SET now_playing_id = $2 WHERE code = $1`, [
      input.code,
      input.videoId,
    ]),
    db.query(
      `UPDATE queue_items
          SET watched_by = array_append(watched_by, $2)
        WHERE id = $1 AND NOT ($2 = ANY(watched_by))`,
      [input.videoId, input.userId],
    ),
  ]);
}

export async function unwatchVideo(input: VideoActionInput): Promise<void> {
  const db = await getDb();
  const item = await findQueueItem(input.videoId, input.partyCode);
  if (!item)
    throw new TRPCError({ code: "NOT_FOUND", message: "Video not found" });

  await db.query(
    `UPDATE queue_items
        SET watched_by = array_remove(watched_by, $2),
            reactions = reactions - $2
      WHERE id = $1`,
    [input.videoId, input.userId],
  );
}

export async function reactToVideo(input: ReactInput): Promise<void> {
  if (!isValidReaction(input.reaction))
    throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid reaction" });
  const db = await getDb();
  const item = await findQueueItem(input.videoId, input.partyCode);
  if (!item)
    throw new TRPCError({ code: "NOT_FOUND", message: "Video not found" });

  if (item.reactions?.[input.userId] === input.reaction) {
    await db.query(
      `UPDATE queue_items SET reactions = reactions - $2 WHERE id = $1`,
      [input.videoId, input.userId],
    );
  } else {
    await db.query(
      `UPDATE queue_items
          SET reactions = reactions || jsonb_build_object($2::text, $3::text)
        WHERE id = $1`,
      [input.videoId, input.userId, input.reaction],
    );
  }
}

async function findQueueItem(
  videoId: string,
  partyCode: string,
): Promise<QueueRow | null> {
  const db = await getDb();
  const { rows } = await db.query<QueueRow>(
    `SELECT id, url, platform, video_id, title, creator, thumbnail,
            added_by_id, added_by_name, created_at, watched_by, reactions
       FROM queue_items WHERE id = $1 AND party_code = $2`,
    [videoId, partyCode],
  );
  return rows[0] ?? null;
}

/** Context used by the SEO invite page + OG image. */
export async function partyInviteContext(code: string) {
  const party = await getParty(code);
  if (!party) return null;
  const memberCount = await getMemberCount(code);
  return { hostName: party.hostName || "Someone", code, memberCount };
}
