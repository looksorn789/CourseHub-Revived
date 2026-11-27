"""Tiny in-process TTL cache for hot, cheap-to-recompute lookups.

Per process only (no Redis): fine for one backend instance and free. Each
entry expires after `ttl` seconds; callers invalidate keys when the
underlying data changes.
"""
import time
from threading import Lock


class TTLCache:
    def __init__(self, ttl: float, maxsize: int = 5000):
        self.ttl = ttl
        self.maxsize = maxsize
        self._data = {}
        self._lock = Lock()

    def get(self, key, default=None):
        with self._lock:
            hit = self._data.get(key)
            if not hit:
                return default
            expires, value = hit
            if expires < time.monotonic():
                del self._data[key]
                return default
            return value

    def set(self, key, value):
        with self._lock:
            if len(self._data) >= self.maxsize:
                self._data.clear()  # crude but bounded
            self._data[key] = (time.monotonic() + self.ttl, value)
        return value

    def get_or_set(self, key, compute):
        value = self.get(key)
        if value is None:
            value = self.set(key, compute())
        return value

    def delete(self, key):
        with self._lock:
            self._data.pop(key, None)

    def clear(self):
        with self._lock:
            self._data.clear()


# Supabase identity -> Mongo user id. Ids never change; only account
# deletion invalidates (see routes/auth.py delete_account).
user_ids = TTLCache(ttl=600)
# user id -> forums whose content that user can't see. Invalidated when the
# user's memberships or a forum's visibility change.
hidden_forums = TTLCache(ttl=60)
# user id -> popular tags (expensive aggregation; slight staleness is fine).
popular_tags = TTLCache(ttl=60)
