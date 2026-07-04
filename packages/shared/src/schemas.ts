import { z } from "zod";

export const platformSchema = z.enum(["youtube", "tiktok", "instagram", "facebook"]);

export const partyCodeSchema = z
  .string()
  .regex(/^\d{5}$/, "Party code must be 5 digits");

export const reactionsSchema = z.record(z.string(), z.string());

/** A party member (host or guest). */
export const memberSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  avatarFace: z.number().int().min(0).max(29).optional(),
  joinedAt: z.string().default(""),
});

/** A single video in the party queue. */
export const queueItemSchema = z.object({
  id: z.string(),
  url: z.string(),
  platform: platformSchema,
  videoId: z.string().nullable(),
  title: z.string(),
  creator: z.string().default(""),
  thumbnail: z.string().default(""),
  addedById: z.string(),
  addedByName: z.string(),
  createdAt: z.string().default(""),
  watchedBy: z.array(z.string()).default([]),
  watchCount: z.number().default(0),
  reactions: reactionsSchema.default({}),
});

export const partySchema = z.object({
  code: partyCodeSchema,
  hostId: z.string(),
  hostName: z.string(),
  nowPlayingId: z.string().nullable(),
});

/** Full hydrated party view used by the client screens. */
export const partyViewSchema = partySchema.extend({
  members: z.array(memberSchema),
  queue: z.array(queueItemSchema),
});

/* ------------------------------------------------------------------ */
/* tRPC procedure inputs                                               */
/* ------------------------------------------------------------------ */

export const createPartyInput = z.object({
  code: partyCodeSchema,
  hostId: z.string().min(1),
  hostName: z.string().min(1).max(40),
});

export const joinPartyInput = z.object({
  code: partyCodeSchema,
  id: z.string().min(1),
  name: z.string().min(1).max(40),
});

export const addVideoInput = z.object({
  id: z.string().min(1),
  partyCode: partyCodeSchema,
  url: z.string().url(),
  platform: platformSchema,
  videoId: z.string().nullable(),
  title: z.string(),
  creator: z.string().default(""),
  thumbnail: z.string().default(""),
  addedById: z.string().min(1),
  addedByName: z.string().min(1),
  position: z.number().int().nonnegative(),
});

export const playVideoInput = z.object({
  code: partyCodeSchema,
  videoId: z.string().min(1),
  userId: z.string().min(1),
});

export const videoActionInput = z.object({
  partyCode: partyCodeSchema,
  videoId: z.string().min(1),
  userId: z.string().min(1),
});

export const reactInput = videoActionInput.extend({
  reaction: z.string().min(1),
});

export const removeMemberInput = z.object({
  code: partyCodeSchema,
  memberId: z.string().min(1),
  hostId: z.string().min(1),
});

export const metaInput = z.object({
  url: z.string().url(),
});

export const metaResult = z.object({
  title: z.string(),
  creator: z.string(),
  thumbnail: z.string(),
  url: z.string().optional(),
});
