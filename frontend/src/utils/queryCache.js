import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Small "stale-while-revalidate" cache for API data.
 *
 * - Cached data is shown immediately; a fresh copy is fetched in the
 *   background when it's older than `ttl` (and always on mount for lists
 *   that change often), then swapped in.
 * - Kept in memory and sessionStorage, so it survives page reloads but not
 *   closing the tab. Keys are namespaced by the signed-in user, and
 *   clearQueryCache() wipes everything on sign-out.
 * - Concurrent requests for the same key share one network call.
 */
const PREFIX = "coursehub-cache:";
const MAX_STORED_BYTES = 300_000; // skip sessionStorage for very large entries
const memory = new Map(); // fullKey -> { data, at }
const inflight = new Map(); // fullKey -> Promise
const listeners = new Map(); // fullKey -> Set<fn>

function userScope() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}").user_id || "anon";
  } catch {
    return "anon";
  }
}
const fullKey = (key) => `${userScope()}:${key}`;

function read(fk) {
  if (memory.has(fk)) return memory.get(fk);
  try {
    const raw = sessionStorage.getItem(PREFIX + fk);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    memory.set(fk, entry);
    return entry;
  } catch {
    return null;
  }
}

function write(fk, data) {
  const entry = { data, at: Date.now() };
  memory.set(fk, entry);
  try {
    const raw = JSON.stringify(entry);
    if (raw.length <= MAX_STORED_BYTES) sessionStorage.setItem(PREFIX + fk, raw);
    else sessionStorage.removeItem(PREFIX + fk);
  } catch {
    // storage full or unavailable: memory cache still works
  }
  listeners.get(fk)?.forEach((fn) => fn(entry));
  return entry;
}

/** For services returning { data, error }: data, or throw (errors aren't cached). */
export async function orThrow(promise) {
  const result = await promise;
  if (result?.error) throw new Error(result.error);
  return result?.data;
}

/** Cached value for a key (or undefined). */
export function getCached(key) {
  return read(fullKey(key))?.data;
}

/** Store a value (e.g. after a mutation updated it locally). */
export function setCached(key, data) {
  write(fullKey(key), data);
}

/** Fetch through the cache: one request per key at a time. */
export function fetchCached(key, fetcher) {
  const fk = fullKey(key);
  if (inflight.has(fk)) return inflight.get(fk);
  const promise = Promise.resolve()
    .then(fetcher)
    .then((data) => {
      write(fk, data);
      return data;
    })
    .finally(() => inflight.delete(fk));
  inflight.set(fk, promise);
  return promise;
}

/** Drop cached entries whose key starts with any of the prefixes. */
export function invalidateCached(...prefixes) {
  const scope = `${userScope()}:`;
  const match = (fk) => prefixes.some((p) => fk.startsWith(scope + p));
  [...memory.keys()].filter(match).forEach((fk) => {
    memory.delete(fk);
    listeners.get(fk)?.forEach((fn) => fn(null));
  });
  try {
    Object.keys(sessionStorage)
      .filter((k) => k.startsWith(PREFIX) && match(k.slice(PREFIX.length)))
      .forEach((k) => sessionStorage.removeItem(k));
  } catch {
    // ignore
  }
}

/** Forget everything (sign-out). */
export function clearQueryCache() {
  memory.clear();
  inflight.clear();
  try {
    Object.keys(sessionStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => sessionStorage.removeItem(k));
  } catch {
    // ignore
  }
}

/**
 * React hook: { data, loading, error, refresh, mutate }.
 * `loading` is only true when there is nothing cached to show yet.
 * `ttl` (ms): cached data younger than this isn't refetched on mount.
 */
export function useCachedQuery(key, fetcher, { ttl = 0, enabled = true } = {}) {
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const [entry, setEntry] = useState(() => (enabled && key ? read(fullKey(key)) : null));
  const [error, setError] = useState(null);
  const [fetching, setFetching] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled || !key) return undefined;
    setFetching(true);
    try {
      const data = await fetchCached(key, () => fetcherRef.current());
      setError(null);
      return data;
    } catch (err) {
      setError(err);
      return undefined;
    } finally {
      setFetching(false);
    }
  }, [key, enabled]);

  useEffect(() => {
    if (!enabled || !key) return undefined;
    const fk = fullKey(key);
    const current = read(fk);
    setEntry(current);
    const onChange = (next) => {
      setEntry(next);
      if (next === null) refresh(); // invalidated: reload
    };
    if (!listeners.has(fk)) listeners.set(fk, new Set());
    listeners.get(fk).add(onChange);
    if (!current || Date.now() - current.at >= ttl) refresh();
    return () => listeners.get(fk)?.delete(onChange);
  }, [key, enabled, ttl, refresh]);

  const mutate = useCallback(
    (updater) => {
      if (!key) return;
      const prev = read(fullKey(key))?.data;
      write(fullKey(key), typeof updater === "function" ? updater(prev) : updater);
    },
    [key],
  );

  return { data: entry?.data, loading: !entry && (fetching || enabled), error, refresh, mutate, fetching };
}
