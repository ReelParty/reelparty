import { rid } from "./ids";

/**
 * Minimal async key/value contract. Web wraps localStorage, native uses
 * AsyncStorage — both satisfy this so all session/auth logic stays shared.
 */
export interface KeyValueStore {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
}

const UID_KEY = "rp_uid";
const NAME_KEY = "rp_name";
const SESSION_KEY = "rp_session";
const QUEUE_FILTERS_KEY = "rp_queue_filters";
const LEGACY_HIDE_WATCHED_KEY = "rp_hide_watched";

export interface Session {
  code: string;
  watchingVideoId?: string;
}

export interface QueueFilters {
  hideWatched: boolean;
  filterUserId: string | null;
}

/** Wrap a KeyValueStore with the ReelParty session/auth/filter helpers. */
export function createSessionStore(store: KeyValueStore) {
  /** Stable per-device user id (created once, then reused). */
  async function getUserId(): Promise<string> {
    let id = await store.getItem(UID_KEY);
    if (!id) {
      id = rid();
      await store.setItem(UID_KEY, id);
    }
    return id;
  }

  /** Last display name the user entered when joining/creating a party. */
  async function loadDisplayName(): Promise<string | null> {
    try {
      const name = (await store.getItem(NAME_KEY))?.trim();
      return name || null;
    } catch {
      return null;
    }
  }

  async function saveDisplayName(name: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await store.setItem(NAME_KEY, trimmed);
    } catch {
      // ignore write failures (private mode, quota, etc.)
    }
  }

  async function loadSession(): Promise<Session | null> {
    try {
      const raw = await store.getItem(SESSION_KEY);
      const s = JSON.parse(raw || "null") as Session | null;
      return s?.code ? s : null;
    } catch {
      return null;
    }
  }

  async function saveSession(
    code: string | null,
    watchingVideoId?: string | null,
  ): Promise<void> {
    if (!code) {
      await store.removeItem(SESSION_KEY);
      return;
    }
    const prev = await loadSession();
    const payload: Session = { code };
    const nextWatching =
      watchingVideoId !== undefined
        ? watchingVideoId
        : prev?.code === code
          ? prev?.watchingVideoId
          : undefined;
    if (nextWatching) payload.watchingVideoId = nextWatching;
    await store.setItem(SESSION_KEY, JSON.stringify(payload));
  }

  async function loadQueueFilters(code: string | null): Promise<QueueFilters> {
    if (!code) return { hideWatched: false, filterUserId: null };
    try {
      const all = JSON.parse((await store.getItem(QUEUE_FILTERS_KEY)) || "{}");
      const saved = all[code];
      if (saved) {
        return {
          hideWatched: !!saved.hideWatched,
          filterUserId: saved.filterUserId || null,
        };
      }
      const legacy = await store.getItem(LEGACY_HIDE_WATCHED_KEY);
      return { hideWatched: legacy === "1", filterUserId: null };
    } catch {
      return { hideWatched: false, filterUserId: null };
    }
  }

  async function saveQueueFilters(
    code: string | null,
    filters: QueueFilters,
  ): Promise<void> {
    if (!code) return;
    try {
      const all = JSON.parse((await store.getItem(QUEUE_FILTERS_KEY)) || "{}");
      all[code] = {
        hideWatched: !!filters.hideWatched,
        filterUserId: filters.filterUserId || null,
      };
      await store.setItem(QUEUE_FILTERS_KEY, JSON.stringify(all));
      await store.setItem(
        LEGACY_HIDE_WATCHED_KEY,
        filters.hideWatched ? "1" : "0",
      );
    } catch {
      // ignore write failures (private mode, quota, etc.)
    }
  }

  return {
    getUserId,
    loadDisplayName,
    saveDisplayName,
    loadSession,
    saveSession,
    loadQueueFilters,
    saveQueueFilters,
  };
}

export type SessionStore = ReturnType<typeof createSessionStore>;
