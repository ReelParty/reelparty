import { avatarIndexFor } from "@reelparty/shared";
import type { Member, Party, Platform, QueueItem } from "@reelparty/shared";

/** Raw Postgres row shapes (snake_case as stored). */
export interface PartyRow {
  code: string;
  host_id: string;
  host_name: string;
  now_playing_id: string | null;
}

export interface MemberRow {
  id: string;
  name: string;
  color: string;
  avatar_face: number | null;
  joined_at: string;
}

export interface QueueRow {
  id: string;
  url: string;
  platform: Platform;
  video_id: string | null;
  title: string;
  creator: string | null;
  thumbnail: string | null;
  added_by_id: string;
  added_by_name: string;
  created_at: string;
  watched_by: string[];
  reactions: Record<string, string>;
}

export const mapParty = (r: PartyRow | null): Party | null =>
  r && {
    code: r.code,
    hostId: r.host_id,
    hostName: r.host_name,
    nowPlayingId: r.now_playing_id,
  };

export const mapMember = (r: MemberRow): Member => ({
  id: r.id,
  name: r.name,
  color: r.color,
  avatarFace: r.avatar_face ?? avatarIndexFor(r.id),
  joinedAt: r.joined_at || "",
});

export const mapVideo = (r: QueueRow): QueueItem => ({
  id: r.id,
  url: r.url,
  platform: r.platform,
  videoId: r.video_id,
  title: r.title,
  creator: r.creator || "",
  thumbnail: r.thumbnail || "",
  addedById: r.added_by_id,
  addedByName: r.added_by_name,
  createdAt: r.created_at || "",
  watchedBy: Array.isArray(r.watched_by) ? r.watched_by : [],
  watchCount: Array.isArray(r.watched_by) ? r.watched_by.length : 0,
  reactions:
    r.reactions && typeof r.reactions === "object" ? r.reactions : {},
});
