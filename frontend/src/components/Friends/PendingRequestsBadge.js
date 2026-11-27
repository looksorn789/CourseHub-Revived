import { useEffect, useState } from "react";
import { FRIEND_REQUESTS_CHANGED_EVENT, getPendingRequestCount } from "../../services/friendsService";
import { fetchCached, getCached, invalidateCached } from "../../utils/queryCache";

const KEY = "friends:pending-count";
const POLL_MS = 60_000;

/**
 * Friend requests waiting for an answer (for the red badge on Friends).
 * Starts from the cache, refreshes every minute while the tab is visible,
 * when it becomes visible again, and right after you send, accept, decline
 * or cancel a request. Components using it share one network request.
 */
export function usePendingFriendRequests() {
  const [count, setCount] = useState(() => getCached(KEY) || 0);

  useEffect(() => {
    let cancelled = false;
    const load = async (fresh) => {
      if (!localStorage.getItem("user")) return;
      if (fresh) invalidateCached(KEY);
      try {
        const n = await fetchCached(KEY, getPendingRequestCount);
        if (!cancelled) setCount(n);
      } catch {
        // keep the last known count
      }
    };
    const refresh = () => load(true);
    const onVisible = () => document.visibilityState === "visible" && refresh();
    load(false);
    const timer = setInterval(onVisible, POLL_MS);
    window.addEventListener(FRIEND_REQUESTS_CHANGED_EVENT, refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener(FRIEND_REQUESTS_CHANGED_EVENT, refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return count;
}

/** Red count bubble ("9+" above 9); renders nothing at 0. */
export default function PendingRequestsBadge({ count, className = "" }) {
  if (!count) return null;
  return (
    <span
      aria-label={`${count} pending friend request${count === 1 ? "" : "s"}`}
      className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold leading-none text-white ${className}`}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
