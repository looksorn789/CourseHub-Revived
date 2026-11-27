from datetime import datetime
from enum import Enum
from typing import Optional, Tuple
from bson import ObjectId
from flask import current_app

class RequestStatus(Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"

class FriendRequest:
    _prepared_dbs = set()

    def __init__(self, db, supabase):
        self.collection = db["friend_requests"]
        self.supabase = supabase
        # Index setup is slow over the network and only needs to happen once
        # per process; a model is constructed on every request.
        if db.name not in FriendRequest._prepared_dbs:
            self._setup_indexes()
            FriendRequest._prepared_dbs.add(db.name)

    def _setup_indexes(self):
        """Set up indexes for faster queries"""
        try:
            indexes = [
                ("sender_id", 1),
                ("receiver_id", 1),
                ("status", 1),
                ("created_at", -1)
            ]

            for index in indexes:
                self.collection.create_index([index])

        except Exception as e:
            current_app.logger.error(f"Error setting up indexes: {str(e)}")

    def create_request(
        self, sender_id: str, receiver_id: str
    ) -> Tuple[bool, Optional[str], Optional[str]]:
        """Send a friend request. Returns (success, error, request_id)."""
        try:
            # Check if request already exists
            existing_request = self.collection.find_one({
                "$or": [
                    {"sender_id": ObjectId(sender_id), "receiver_id": ObjectId(receiver_id)},
                    {"sender_id": ObjectId(receiver_id), "receiver_id": ObjectId(sender_id)}
                ]
            })

            if existing_request:
                return False, "Friend request already exists", None

            request_data = {
                "sender_id": ObjectId(sender_id),
                "receiver_id": ObjectId(receiver_id),
                "status": RequestStatus.PENDING.value,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }

            result = self.collection.insert_one(request_data)
            request_id = str(result.inserted_id) if result.inserted_id else None
            return bool(result.inserted_id), None, request_id

        except Exception as e:
            return False, str(e), None

    def get_pending_requests(self, user_id: str) -> list:
        """Get pending friend requests for a user"""
        try:
            requests = list(self.collection.find({
                "receiver_id": ObjectId(user_id),
                "status": RequestStatus.PENDING.value
            }).sort("created_at", -1))

            return requests
        except Exception as e:
            current_app.logger.error(f"Error getting pending requests: {str(e)}")
            return []

    def respond_to_request(self, request_id: str, response: bool) -> Tuple[bool, Optional[str]]:
        """Accept or decline a friend request"""
        try:
            request = self.collection.find_one({"_id": ObjectId(request_id)})
            if not request:
                return False, "Request not found"

            new_status = RequestStatus.ACCEPTED.value if response else RequestStatus.DECLINED.value

            result = self.collection.update_one(
                {"_id": ObjectId(request_id)},
                {
                    "$set": {
                        "status": new_status,
                        "updated_at": datetime.utcnow()
                    }
                }
            )

            return result.modified_count > 0, None

        except Exception as e:
            return False, str(e)

    def get_sent_requests(self, user_id: str) -> list:
        """Get friend requests sent by a user"""
        try:
            requests = list(self.collection.find({
                "sender_id": ObjectId(user_id),
                "status": RequestStatus.PENDING.value
            }).sort("created_at", -1))

            return requests
        except Exception as e:
            current_app.logger.error(f"Error getting sent requests: {str(e)}")
            return []

    def cancel_request(self, request_id: str, sender_id: str) -> Tuple[bool, Optional[str]]:
        """Cancel a friend request"""
        try:
            request = self.collection.find_one({
                "_id": ObjectId(request_id),
                "sender_id": ObjectId(sender_id),
                "status": RequestStatus.PENDING.value
            })

            if not request:
                return False, "Request not found or cannot be cancelled"

            result = self.collection.delete_one({
                "_id": ObjectId(request_id)
            })

            return result.deleted_count > 0, None

        except Exception as e:
            return False, str(e)

    def get_friends(self, user_id: str) -> list:
        """Get list of friends for a user"""
        try:
            accepted_requests = self.collection.find({
                "$or": [
                    {"sender_id": ObjectId(user_id)},
                    {"receiver_id": ObjectId(user_id)}
                ],
                "status": RequestStatus.ACCEPTED.value
            })

            friends = []
            for req in accepted_requests:
                if str(req["sender_id"]) != user_id:
                    friends.append(req["sender_id"])
                if str(req["receiver_id"]) != user_id:
                    friends.append(req["receiver_id"])
            return friends
        except Exception as e:
            current_app.logger.error(f"Error getting friends: {str(e)}")
            return []

    def unfriend(self, user_id: str, friend_id: str) -> Tuple[bool, Optional[str]]:
        """Unfriend a user"""
        try:
            result = self.collection.delete_one({
                "$or": [
                    {"sender_id": ObjectId(user_id), "receiver_id": ObjectId(friend_id)},
                    {"sender_id": ObjectId(friend_id), "receiver_id": ObjectId(user_id)}
                ],
                "status": RequestStatus.ACCEPTED.value
            })

            return result.deleted_count > 0, None
        except Exception as e:
            return False, str(e)
