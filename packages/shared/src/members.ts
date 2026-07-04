import { avatarColorFor, avatarIndexFor } from "./avatars";
import type { PartyView, QueueItem, ResolvedMember } from "./types";

/** Resolve a member id to a display member, falling back to booted guests. */
export function resolveMember(
  party: PartyView | null | undefined,
  memberId: string,
  video?: QueueItem,
): ResolvedMember {
  const member = party?.members.find((m) => m.id === memberId);
  if (member) return { ...member, booted: false };
  const name =
    (video?.addedById === memberId ? video.addedByName : null) ||
    party?.queue.find((q) => q.addedById === memberId)?.addedByName ||
    "Guest";
  return {
    id: memberId,
    name,
    color: avatarColorFor(memberId),
    avatarFace: avatarIndexFor(memberId),
    booted: true,
    joinedAt: "",
  };
}

/** Distinct people who added videos, with the current user first. */
export function queueAdders(
  party: PartyView | null | undefined,
  userId: string,
): ResolvedMember[] {
  if (!party?.queue?.length) return [];
  const seen = new Set<string>();
  const adders: ResolvedMember[] = [];
  for (const v of party.queue) {
    if (seen.has(v.addedById)) continue;
    seen.add(v.addedById);
    adders.push(resolveMember(party, v.addedById, v));
  }
  return adders.sort((a, b) => {
    if (a.id === userId) return -1;
    if (b.id === userId) return 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

/** Order members: you, then host, then everyone else by join time. */
export function sortMembersForDisplay<T extends { id: string; joinedAt?: string }>(
  members: T[],
  userId: string,
  hostId: string,
): T[] {
  const byJoinOrder = (a: T, b: T) =>
    (a.joinedAt || "").localeCompare(b.joinedAt || "");
  const meMember = members.find((m) => m.id === userId);
  const hostMember = members.find((m) => m.id === hostId);
  const rest = members
    .filter((m) => m.id !== userId && m.id !== hostId)
    .sort(byJoinOrder);
  return [
    ...(meMember ? [meMember] : []),
    ...(hostMember && hostMember.id !== userId ? [hostMember] : []),
    ...rest,
  ];
}

export function memberLabel({
  name,
  booted,
}: {
  name: string;
  booted: boolean;
}): string {
  return booted ? `${name} (booted)` : name;
}
