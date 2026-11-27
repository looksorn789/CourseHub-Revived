"""One reaction per user per post, with per-post counts kept on the post."""
from datetime import datetime
from typing import Dict, Optional, Tuple

from bson import ObjectId
from pymongo import ASCENDING, IndexModel, ReturnDocument
from pymongo.errors import DuplicateKeyError

REACTION_TYPES = ("thumbs_up", "thumbs_down", "heart", "laugh", "smile", "cry")


class PostReactions:
    """Reactions live in ``post_reactions`` (unique per post+user); each post
    keeps ``reaction_counts`` so lists can show totals without extra queries."""

    _prepared_dbs = set()

    def __init__(self, db):
        self.collection = db["post_reactions"]
        self.posts = db["posts"]
        if db.name not in PostReactions._prepared_dbs:
            self.collection.create_indexes([
                IndexModel([("post_id", ASCENDING), ("user_id", ASCENDING)], unique=True),
            ])
            PostReactions._prepared_dbs.add(db.name)

    def _counts(self, post_id: ObjectId, inc: Dict[str, int]) -> Dict[str, int]:
        if inc:
            post = self.posts.find_one_and_update(
                {"_id": post_id},
                {"$inc": inc},
                projection={"reaction_counts": 1},
                return_document=ReturnDocument.AFTER,
            )
        else:
            post = self.posts.find_one({"_id": post_id}, {"reaction_counts": 1})
        counts = (post or {}).get("reaction_counts") or {}
        return {k: v for k, v in counts.items() if v > 0}

    def react(self, post_id: ObjectId, user_id: ObjectId, reaction: str) -> Tuple[Dict[str, int], str]:
        """Set (or change) the user's reaction. Returns (counts, reaction)."""
        now = datetime.utcnow()
        for _ in range(2):  # a concurrent first reaction can race the upsert
            try:
                previous = self.collection.find_one_and_update(
                    {"post_id": post_id, "user_id": user_id},
                    {"$set": {"type": reaction, "updated_at": now}, "$setOnInsert": {"created_at": now}},
                    upsert=True,
                    return_document=ReturnDocument.BEFORE,
                )
                break
            except DuplicateKeyError:
                continue
        inc: Dict[str, int] = {}
        if previous is None:
            inc[f"reaction_counts.{reaction}"] = 1
        elif previous.get("type") != reaction:
            inc[f"reaction_counts.{reaction}"] = 1
            inc[f"reaction_counts.{previous['type']}"] = -1
        return self._counts(post_id, inc), reaction

    def remove(self, post_id: ObjectId, user_id: ObjectId) -> Tuple[Dict[str, int], Optional[str]]:
        previous = self.collection.find_one_and_delete({"post_id": post_id, "user_id": user_id})
        inc = {f"reaction_counts.{previous['type']}": -1} if previous else {}
        return self._counts(post_id, inc), None

    def delete_for_post(self, post_id: ObjectId) -> None:
        self.collection.delete_many({"post_id": post_id})
