from datetime import datetime
from enum import Enum
from typing import Dict, Optional, Tuple, List
from bson import ObjectId
from flask import current_app
from pymongo import ASCENDING, DESCENDING

class ReplyStatus(Enum):
    ACTIVE = "active"
    DELETED = "deleted"
    HIDDEN = "hidden"

class Reply:
    # Field Validation rules
    REPLY_FIELDS = {
        "content": {
            "type": str,
            "required": True,
            "min_length": 1,
            "max_length": 500,
            "error": "Content must be between 1 and 500 characters",
        },
        "comment_id": {
            "type": str,
            "required": True,
            "error": "Comment ID is required",
        },
        "user_id": {
            "type": str,
            "required": True,
            "error": "User ID is required",
        },
    }

    def __init__(self, db, supabase):
        self.collection = db["replies"]
        self.supabase = supabase
        self._setup_indexes()

    def _setup_indexes(self):
        """Set up indexes for faster queries"""
        try:
            indexes = [
                ("comment_id", 1),
                ("user_id", 1),
                ("created_at", -1),
                ("status", 1),
                ("likes", -1)
            ]
            
            for index in indexes:
                self.collection.create_index([index])

        except Exception as e:
            current_app.logger.error(f"Error setting up indexes: {str(e)}")

    def create_reply(self, data: Dict) -> Tuple[Optional[str], Optional[str]]:
        """Create a new reply"""
        try:
            with self.collection.database.client.start_session() as session:
                with session.start_transaction():
                    # Validate reply data
                    is_valid, errors = self.validate_reply_data(data)
                    if not is_valid:
                        return None, errors
                    
                    current_time = datetime.utcnow()

                    # Prepare reply document
                    reply_data = {
                        "comment_id": ObjectId(data["comment_id"]),
                        "user_id": ObjectId(data["user_id"]),
                        "content": data["content"].strip(),
                        "created_at": current_time,
                        "updated_at": current_time,
                        "status": ReplyStatus.ACTIVE.value,
                        "likes": 0,
                        "metadata": {
                            "edited": False,
                            "last_edited_at": None,
                            "original_content": None
                        }
                    }

                    # Insert reply
                    result = self.collection.insert_one(reply_data, session=session)
                    if not result.inserted_id:
                        return None, "Failed to create reply"

                    # Update comment reply count
                    comments_collection = self.collection.database.get_collection('comments')
                    update_result = comments_collection.update_one(
                        {"_id": ObjectId(data["comment_id"])},
                        {
                            "$inc": {"reply_count": 1},
                            "$set": {"last_activity_at": current_time}
                        },
                        session=session
                    )

                    if update_result.modified_count == 0:
                        return None, "Failed to update comment reply count"

                    return str(result.inserted_id), None

        except Exception as e:
            current_app.logger.error(f"Error creating reply: {str(e)}")
            return None, f"Error creating reply: {str(e)}"

    def update_reply(self, reply_id: str, data: Dict) -> Tuple[bool, Optional[str]]:
        """Update an existing reply"""
        try:
            reply = self.find_by_id(reply_id)
            if not reply:
                return False, "Reply not found"
            
            # Validate update data
            is_valid, errors = self.validate_reply_data(data, is_update=True)
            if not is_valid:
                return False, errors

            current_time = datetime.utcnow()

            # Prepare update data
            update_data = {
                "updated_at": current_time,
                "metadata.edited": True,
                "metadata.last_edited_at": current_time
            }

            # Store original content if this is the first edit
            if not reply.get("metadata", {}).get("edited", False):
                update_data["metadata.original_content"] = reply["content"]

            if "content" in data:
                update_data["content"] = data["content"].strip()

            # Update reply in database
            result = self.collection.update_one(
                {"_id": ObjectId(reply_id)},
                {"$set": update_data}
            )

            return result.modified_count > 0, None

        except Exception as e:
            return False, f"Error updating reply: {str(e)}"

    def get_replies_by_comment(
        self,
        comment_id: str,
        page: int = 1,
        per_page: int = 20
    ) -> Tuple[List[Dict], int]:
        """Get paginated replies for a comment"""
        try:
            # Build query
            query = {
                "comment_id": ObjectId(comment_id),
                "status": ReplyStatus.ACTIVE.value
            }

            # Calculate skip value for pagination
            skip = (page - 1) * per_page

            total = self.collection.count_documents(query)
            
            # Get replies with pagination
            replies = list(
                self.collection.find(query)
                .sort("created_at", ASCENDING)
                .skip(skip)
                .limit(per_page)
            )

            # Clean up ObjectId fields
            for reply in replies:
                reply["_id"] = str(reply["_id"])
                reply["comment_id"] = str(reply["comment_id"])
                reply["user_id"] = str(reply["user_id"])

            return replies, total

        except Exception as e:
            current_app.logger.error(f"Error getting comment replies: {str(e)}")
            return [], 0

    def find_by_id(self, reply_id: str) -> Optional[Dict]:
        """Find reply by ID"""
        try:
            return self.collection.find_one({
                "_id": ObjectId(reply_id),
                "status": ReplyStatus.ACTIVE.value
            })
        except Exception:
            return None

    def delete_reply(self, reply_id: str) -> Tuple[bool, Optional[str]]:
        """Soft delete a reply"""
        try:
            with self.collection.database.client.start_session() as session:
                with session.start_transaction():
                    reply = self.find_by_id(reply_id)
                    if not reply:
                        return False, "Reply not found"

                    # Soft delete by updating status
                    delete_result = self.collection.update_one(
                        {"_id": ObjectId(reply_id)},
                        {
                            "$set": {
                                "status": ReplyStatus.DELETED.value,
                                "updated_at": datetime.utcnow()
                            }
                        },
                        session=session
                    )

                    if delete_result.modified_count == 0:
                        return False, "Failed to delete reply"

                    # Update comment reply count
                    comments_collection = self.collection.database.get_collection('comments')
                    comment_update = comments_collection.update_one(
                        {"_id": reply["comment_id"]},
                        {
                            "$inc": {"reply_count": -1},
                            "$set": {"updated_at": datetime.utcnow()}
                        },
                        session=session
                    )

                    if comment_update.modified_count == 0:
                        return False, "Failed to update comment reply count"

                    return True, None

        except Exception as e:
            current_app.logger.error(f"Error deleting reply: {str(e)}")
            return False, f"Error deleting reply: {str(e)}"

    def validate_reply_data(self, data: Dict, is_update: bool = False) -> Tuple[bool, Optional[str]]:
        """Validate reply data"""
        errors = []

        for field_name, rules in self.REPLY_FIELDS.items():
            if field_name in data:
                # Type validation
                if not isinstance(data[field_name], rules["type"]):
                    errors.append(f"{field_name} must be of type {rules['type'].__name__}")
                    continue

                # String validations
                if isinstance(data[field_name], str):
                    if "min_length" in rules and len(data[field_name].strip()) < rules["min_length"]:
                        errors.append(f"{field_name} must be at least {rules['min_length']} characters")
                    if "max_length" in rules and len(data[field_name].strip()) > rules["max_length"]:
                        errors.append(f"{field_name} must not exceed {rules['max_length']} characters")

            elif rules.get("required", False) and not is_update:
                errors.append(f"{field_name} is required")

        return len(errors) == 0, "\n".join(errors) if errors else None

    def toggle_like(self, reply_id: str, user_id: str) -> Tuple[bool, Optional[str]]:
        """Toggle like status for a reply"""
        try:
            reply = self.find_by_id(reply_id)
            if not reply:
                return False, "Reply not found"

            # Check if user has already liked
            likes_collection = self.collection.database.get_collection('reply_likes')
            existing_like = likes_collection.find_one({
                "reply_id": ObjectId(reply_id),
                "user_id": ObjectId(user_id)
            })

            with self.collection.database.client.start_session() as session:
                with session.start_transaction():
                    if existing_like:
                        # Remove like
                        likes_collection.delete_one(
                            {"_id": existing_like["_id"]},
                            session=session
                        )
                        self.collection.update_one(
                            {"_id": ObjectId(reply_id)},
                            {"$inc": {"likes": -1}},
                            session=session
                        )
                        return True, "Like removed"
                    else:
                        # Add like
                        likes_collection.insert_one({
                            "reply_id": ObjectId(reply_id),
                            "user_id": ObjectId(user_id),
                            "created_at": datetime.utcnow()
                        }, session=session)
                        self.collection.update_one(
                            {"_id": ObjectId(reply_id)},
                            {"$inc": {"likes": 1}},
                            session=session
                        )
                        return True, "Reply liked"

        except Exception as e:
            current_app.logger.error(f"Error toggling like: {str(e)}")
            return False, f"Error toggling like: {str(e)}"