import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL || "postgres://127.0.0.1:5432/reelparty";

// pg silently mis-parses strings that don't start with the scheme (e.g. a
// pasted value with a stray quote or invisible character) and connects to a
// placeholder host named "base". Fail loudly instead.
if (!/^postgres(ql)?:\/\//.test(connectionString)) {
  throw new Error(
    `DATABASE_URL must start with postgres:// or postgresql://; got a value starting with ${JSON.stringify(connectionString.slice(0, 12))}`,
  );
}

/**
 * Lazily-created, cached pg pool. Caching on globalThis avoids exhausting
 * connections during Next.js dev hot-reloads / serverless reuse.
 */
const globalForPg = globalThis as unknown as {
  _reelpartyPg?: Promise<Pool>;
};

/**
 * Applied idempotently on first connect so local dev and fresh deploys need
 * no manual migration step. Keep in sync with /schema.sql (the canonical
 * copy); it is inlined here because the repo-root file is not available in
 * serverless bundles.
 */
const SCHEMA = `
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
`;

async function connect(): Promise<Pool> {
  const pool = new Pool({
    connectionString,
    // Keep the per-instance footprint small; serverless platforms run many
    // concurrent instances against one database.
    max: 5,
  });
  await pool.query(SCHEMA);
  return pool;
}

export function getDb(): Promise<Pool> {
  if (!globalForPg._reelpartyPg) {
    globalForPg._reelpartyPg = connect().catch((err) => {
      // Don't cache failures, or one transient error (e.g. the database
      // waking from autosuspend) would wedge this instance permanently.
      globalForPg._reelpartyPg = undefined;
      throw err;
    });
  }
  return globalForPg._reelpartyPg;
}
