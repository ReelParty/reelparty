-- ReelParty Postgres schema.
-- Applied automatically (idempotently) on server startup by
-- packages/api/src/server/db.ts; kept here as the canonical reference
-- and for manual setup: psql "$DATABASE_URL" -f schema.sql
--
-- Timestamps are stored as ISO-8601 strings (TEXT) so they round-trip
-- unchanged to the clients and sort lexicographically.

CREATE TABLE IF NOT EXISTS parties (
  code            TEXT PRIMARY KEY,
  host_id         TEXT NOT NULL,
  host_name       TEXT NOT NULL,
  now_playing_id  TEXT,
  created_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS members (
  id          TEXT NOT NULL,
  party_code  TEXT NOT NULL REFERENCES parties(code) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  color       TEXT NOT NULL,
  avatar_face INTEGER,
  joined_at   TEXT NOT NULL,
  PRIMARY KEY (id, party_code)
);

CREATE INDEX IF NOT EXISTS members_party_joined_idx
  ON members (party_code, joined_at);

CREATE TABLE IF NOT EXISTS queue_items (
  id            TEXT PRIMARY KEY,
  party_code    TEXT NOT NULL REFERENCES parties(code) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  platform      TEXT NOT NULL,
  video_id      TEXT,
  title         TEXT NOT NULL,
  creator       TEXT,
  thumbnail     TEXT,
  added_by_id   TEXT NOT NULL,
  added_by_name TEXT NOT NULL,
  watched_by    TEXT[] NOT NULL DEFAULT '{}',
  reactions     JSONB NOT NULL DEFAULT '{}',
  position      INTEGER NOT NULL,
  created_at    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS queue_items_party_position_idx
  ON queue_items (party_code, position);
