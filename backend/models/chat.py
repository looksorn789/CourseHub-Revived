"""Direct and group conversations and their messages."""
from datetime import datetime
from typing import List, Optional

from bson import ObjectId
from pymongo import ASCENDING, DESCENDING, IndexModel

MAX_MESSAGE_LENGTH = 2000
MAX_GROUP_SIZE = 20

USER_SUMMARY = {
    "username": 1,
    "profile.first_name": 1,
    "profile.last_name": 1,
    "profile.avatar_config": 1,
}


class Chat:
    """Conversations (``conversations``) and messages (``messages``)."""

    _prepared_dbs = set()

    def __init__(self, db):
        self.db = db
        self.conversations = db["conversations"]
        self.messages = db["messages"]
        # Index setup is a network round trip; once per process is enough.
        if db.name not in Chat._prepared_dbs:
            self.conversations.create_indexes([
                IndexModel([("participants", ASCENDING), ("last_message_at", DESCENDING)]),
                IndexModel(
                    [("direct_key", ASCENDING)],
                    unique=True,
                    partialFilterExpression={"direct_key": {"$type": "string"}},
                ),
            ])
            self.messages.create_indexes([
                IndexModel([("conversation_id", ASCENDING), ("_id", DESCENDING)]),
            ])
            Chat._prepared_dbs.add(db.name)

    # --- conversations ---------------------------------------------------

    def get_for_member(self, conversation_id: str, user_id: str) -> Optional[dict]:
        """The conversation if the user is a participant, else None."""
        try:
            return self.conversations.find_one(
                {"_id": ObjectId(conversation_id), "participants": ObjectId(user_id)}
            )
        except Exception:
            return None

    def find_or_create(self, user_id: str, other_ids: List[str], name: str = "") -> ObjectId:
        """Direct chat for 1 other person (reused if it exists), group otherwise."""
        me = ObjectId(user_id)
        others = sorted({ObjectId(o) for o in other_ids} - {me})
        now = datetime.utcnow()
        base = {
            "created_by": me,
            "created_at": now,
            "updated_at": now,
            "last_message": None,
            "last_message_at": now,
            "reads": {str(me): now},
        }
        if len(others) == 1:
            direct_key = ":".join(sorted([str(me), str(others[0])]))
            doc = self.conversations.find_one_and_update(
                {"direct_key": direct_key},
                {"$setOnInsert": {
                    **base,
                    "type": "direct",
                    "direct_key": direct_key,
                    "participants": [me, others[0]],
                }},
                upsert=True,
                return_document=True,
            )
            return doc["_id"]
        result = self.conversations.insert_one({
            **base,
            "type": "group",
            "name": name.strip()[:60],
            "participants": [me, *others],
        })
        return result.inserted_id

    def summaries(self, user_id: str, conversation_ids: Optional[list] = None) -> list:
        """The user's conversations (newest activity first) with the other
        participants' names/avatars and an unread count, in one query."""
        me = ObjectId(user_id)
        match = {"participants": me}
        if conversation_ids is not None:
            match["_id"] = {"$in": conversation_ids}
        pipeline = [
            {"$match": match},
            {"$sort": {"last_message_at": -1}},
            {"$limit": 50},
            {"$lookup": {
                "from": "users",
                "localField": "participants",
                "foreignField": "_id",
                "as": "members",
                "pipeline": [{"$project": USER_SUMMARY}],
            }},
            {"$lookup": {
                "from": "messages",
                "let": {
                    "cid": "$_id",
                    "since": {"$ifNull": [
                        {"$getField": {"field": str(me), "input": "$reads"}},
                        datetime(1970, 1, 1),
                    ]},
                },
                "pipeline": [
                    {"$match": {"$expr": {"$and": [
                        {"$eq": ["$conversation_id", "$$cid"]},
                        {"$gt": ["$created_at", "$$since"]},
                        {"$ne": ["$sender_id", me]},
                        {"$ne": ["$deleted", True]},
                    ]}}},
                    {"$count": "n"},
                ],
                "as": "unread",
            }},
            {"$set": {"unread": {"$ifNull": [{"$first": "$unread.n"}, 0]}}},
            {"$project": {"reads": 0, "direct_key": 0}},
        ]
        return list(self.conversations.aggregate(pipeline))

    def mark_read(self, conversation_id: ObjectId, user_id: str) -> None:
        self.conversations.update_one(
            {"_id": conversation_id}, {"$set": {f"reads.{user_id}": datetime.utcnow()}}
        )

    # --- messages --------------------------------------------------------

    def list_messages(self, conversation_id: ObjectId, before: Optional[str], limit: int) -> list:
        query = {"conversation_id": conversation_id}
        if before:
            query["_id"] = {"$lt": ObjectId(before)}
        docs = list(self.messages.find(query).sort("_id", -1).limit(limit))
        docs.reverse()  # oldest first for display
        for d in docs:
            if d.get("deleted"):
                d["content"] = ""
        return docs

    def add_message(self, conversation: dict, sender_id: str, content: str) -> dict:
        now = datetime.utcnow()
        doc = {
            "conversation_id": conversation["_id"],
            "sender_id": ObjectId(sender_id),
            "content": content,
            "created_at": now,
            "deleted": False,
        }
        doc["_id"] = self.messages.insert_one(doc).inserted_id
        self.conversations.update_one(
            {"_id": conversation["_id"]},
            {"$set": {
                "last_message": {
                    "_id": doc["_id"],
                    "content": content[:200],
                    "sender_id": doc["sender_id"],
                    "created_at": now,
                },
                "last_message_at": now,
                "updated_at": now,
                f"reads.{sender_id}": now,
            }},
        )
        return doc

    def delete_message(self, message_id: str, user_id: str) -> Optional[dict]:
        """Soft-delete the user's own message. Returns it (or None)."""
        try:
            return self.messages.find_one_and_update(
                {"_id": ObjectId(message_id), "sender_id": ObjectId(user_id), "deleted": False},
                {"$set": {"deleted": True, "content": "", "deleted_at": datetime.utcnow()}},
                return_document=True,
            )
        except Exception:
            return None
