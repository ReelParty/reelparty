import express from "express";
import db from "./db.js";
import { fetchMeta } from "./meta.js";
import {
  inviteMeta,
  renderInviteHtml,
  renderOgSvg,
  renderDefaultOgSvg,
  requestBaseUrl,
} from "./invitePage.js";

const app = express();
const port = Number(process.env.PORT) || 3001;

app.set("trust proxy", true);
app.use(express.json());

async function partyInviteContext(code) {
  const party = await db.collection("parties").findOne({ code });
  if (!party) return null;
  const memberCount = await db.collection("members").countDocuments({ party_code: code });
  return {
    hostName: party.host_name || "Someone",
    code,
    memberCount,
  };
}

app.get("/join/:code", async (req, res) => {
  const code = req.params.code?.trim();
  if (!/^\d{5}$/.test(code)) {
    return res.status(404).type("html").send("Not found");
  }
  const ctx = await partyInviteContext(code);
  const baseUrl = requestBaseUrl(req);
  const meta = inviteMeta({
    ...(ctx || { hostName: "Someone", memberCount: 0 }),
    code,
    baseUrl,
  });
  if (!ctx) {
    meta.title = "Join a ReelParty 🎬";
    meta.description = `Party code ${code} · Watch TikToks, Reels & Shorts together`;
  }
  res.type("html").send(renderInviteHtml(meta));
});

app.get("/api/og/:code.svg", async (req, res) => {
  const code = req.params.code?.trim();
  if (!/^\d{5}$/.test(code)) {
    res.type("image/svg+xml").send(renderDefaultOgSvg());
    return;
  }
  const ctx = await partyInviteContext(code);
  res
    .type("image/svg+xml")
    .set("Cache-Control", "public, max-age=300")
    .send(ctx ? renderOgSvg(ctx) : renderDefaultOgSvg());
});

app.get("/api/meta", async (req, res) => {
  const url = req.query.url;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "url query parameter required" });
  }
  try {
    const meta = await fetchMeta(url);
    res.json(meta);
  } catch {
    res.status(502).json({ error: "Failed to fetch metadata" });
  }
});

app.get("/api/parties/:code", async (req, res) => {
  const row = await db.collection("parties").findOne({ code: req.params.code });
  res.json(row);
});

app.get("/api/parties/:code/members", async (req, res) => {
  const rows = await db.collection("members")
    .find({ party_code: req.params.code })
    .sort({ joined_at: 1 })
    .toArray();
  res.json(rows);
});

app.get("/api/parties/:code/queue", async (req, res) => {
  const rows = await db.collection("queue_items")
    .find({ party_code: req.params.code })
    .sort({ created_at: 1, position: 1 })
    .toArray();
  res.json(rows);
});

app.post("/api/parties", async (req, res) => {
  const { code, hostId, hostName, color } = req.body;
  const now = new Date().toISOString();
  await db.collection("parties").insertOne({
    code,
    host_id: hostId,
    host_name: hostName,
    now_playing_id: null,
    created_at: now,
  });
  await db.collection("members").updateOne(
    { id: hostId, party_code: code },
    {
      $set: { id: hostId, party_code: code, name: hostName, color },
      $setOnInsert: { joined_at: now },
    },
    { upsert: true },
  );
  res.status(201).json({ ok: true });
});

app.post("/api/parties/:code/members", async (req, res) => {
  const { id, name, color } = req.body;
  await db.collection("members").updateOne(
    { id, party_code: req.params.code },
    {
      $set: { id, party_code: req.params.code, name, color },
      $setOnInsert: { joined_at: new Date().toISOString() },
    },
    { upsert: true },
  );
  res.status(201).json({ ok: true });
});

app.get("/api/parties/:code/members/count", async (req, res) => {
  const count = await db.collection("members").countDocuments({ party_code: req.params.code });
  res.json({ count });
});

app.post("/api/parties/:code/members/:memberId/remove", async (req, res) => {
  const { hostId } = req.body;
  const party = await db.collection("parties").findOne({ code: req.params.code });
  if (!party) return res.status(404).json({ error: "Party not found" });
  if (party.host_id !== hostId) return res.status(403).json({ error: "Not authorized" });
  if (req.params.memberId === party.host_id) return res.status(400).json({ error: "Cannot remove host" });

  const result = await db.collection("members").deleteOne({
    id: req.params.memberId,
    party_code: req.params.code,
  });
  if (result.deletedCount === 0) return res.status(404).json({ error: "Member not found" });
  res.json({ ok: true });
});

app.post("/api/queue", async (req, res) => {
  const v = req.body;
  await db.collection("queue_items").insertOne({
    id: v.id,
    party_code: v.partyCode,
    url: v.url,
    platform: v.platform,
    video_id: v.videoId,
    title: v.title,
    creator: v.creator,
    thumbnail: v.thumbnail,
    added_by_id: v.addedById,
    added_by_name: v.addedByName,
    watched_by: [],
    reactions: {},
    position: v.position,
    created_at: new Date().toISOString(),
  });
  res.status(201).json({ ok: true });
});

app.post("/api/queue/:videoId/remove", async (req, res) => {
  const { userId, partyCode } = req.body;
  const item = await db.collection("queue_items").findOne({
    id: req.params.videoId,
    party_code: partyCode,
  });
  if (!item) return res.status(404).json({ error: "Video not found" });
  const party = await db.collection("parties").findOne({ code: partyCode });
  if (!party) return res.status(404).json({ error: "Party not found" });
  if (item.added_by_id !== userId && party.host_id !== userId) {
    return res.status(403).json({ error: "Not authorized" });
  }

  await db.collection("queue_items").deleteOne({ id: req.params.videoId });
  if (party.now_playing_id === req.params.videoId) {
    await db.collection("parties").updateOne(
      { code: partyCode },
      { $set: { now_playing_id: null } },
    );
  }
  res.json({ ok: true });
});

app.post("/api/parties/:code/play", async (req, res) => {
  const { videoId, userId } = req.body;
  await Promise.all([
    db.collection("parties").updateOne(
      { code: req.params.code },
      { $set: { now_playing_id: videoId } },
    ),
    db.collection("queue_items").updateOne(
      { id: videoId },
      { $addToSet: { watched_by: userId } },
    ),
  ]);
  res.json({ ok: true });
});

app.post("/api/queue/:videoId/unwatch", async (req, res) => {
  const { userId, partyCode } = req.body;
  const item = await db.collection("queue_items").findOne({
    id: req.params.videoId,
    party_code: partyCode,
  });
  if (!item) return res.status(404).json({ error: "Video not found" });

  await db.collection("queue_items").updateOne(
    { id: req.params.videoId },
    {
      $pull: { watched_by: userId },
      $unset: { [`reactions.${userId}`]: "" },
    },
  );
  res.json({ ok: true });
});

const VALID_REACTIONS = ["🔥", "😂", "😍", "😮", "👏", "💀"];

app.post("/api/queue/:videoId/react", async (req, res) => {
  const { userId, partyCode, reaction } = req.body;
  if (!VALID_REACTIONS.includes(reaction)) {
    return res.status(400).json({ error: "Invalid reaction" });
  }
  const item = await db.collection("queue_items").findOne({
    id: req.params.videoId,
    party_code: partyCode,
  });
  if (!item) return res.status(404).json({ error: "Video not found" });
  if (!item.watched_by?.includes(userId)) {
    return res.status(403).json({ error: "Watch the video first" });
  }

  const field = `reactions.${userId}`;
  if (item.reactions?.[userId] === reaction) {
    await db.collection("queue_items").updateOne(
      { id: req.params.videoId },
      { $unset: { [field]: "" } },
    );
  } else {
    await db.collection("queue_items").updateOne(
      { id: req.params.videoId },
      { $set: { [field]: reaction } },
    );
  }
  res.json({ ok: true });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`ReelParty API listening on http://localhost:${port}`);
});
