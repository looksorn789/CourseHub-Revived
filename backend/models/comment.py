from datetime import datetime
from enum import Enum
from typing import Dict, Optional, Tuple, List
from bson import ObjectId
from flask import current_app
from pymongo import ASCENDING, DESCENDING

class CommentStatus(Enum):
    ACTIVE = "active"
    DELETED = "deleted"
    HIDDEN = "hidden"

class Comment:
    # Field Validation rules
    COMMENT_FIELDS = {
        "content": {
            "type": str,
            "required": True,
            "min_length": 1,
            "max_length": 1000,
            "error": "Content must be between 1 and 1000 characters",
        },
        "post_id": {
            "type": str,
            "required": True,
            "error": "Post ID is required",
        },
        "user_id": {
            "type": str,
            "required": True,
            "error": "User ID is required",
        },
        "parent_id": {
            "type": str,
            "required": False,
            "error": "Invalid parent comment ID",
        },
        "mentioned_user": {
            "type": str,
            "required": False,
            "error": "Invalid mentioned user",
        }
    }

    def __init__(self, db, supabase):
        self.collection = db["comments"]
        self.supabase = supabase
        self._setup_indexes()

    def _setup_indexes(self):
        """Set up indexes for faster queries"""
        try:
            indexes = [
                ("post_id", 1),
                ("user_id", 1),
                ("parent_id", 1),
                ("created_at", -1),
                ("status", 1),
                ("likes", -1)
            ]
            
            for index in indexes:
                self.collection.create_index([index])

        except Exception as e:
            current_app.logger.error(f"Error setting up indexes: {str(e)}")

    def create_comment(self, data: Dict) -> Tuple[Optional[str], Optional[str]]:
        """Create a new comment or reply"""
        try:
            with self.collection.database.client.start_session() as session:
                with session.start_transaction():
                    # Validate comment data
                    is_valid, errors = self.validate_comment_data(data)
                    if not is_valid:
                        return None, errors
                    
                    current_time = datetime.utcnow()

                    # Prepare comment data
                    comment_data = {
                        "post_id": ObjectId(data["post_id"]),
                        "user_id": ObjectId(data["user_id"]),
                        "content": data["content"].strip(),
                        "parent_id": ObjectId(data["parent_id"]) if data.get("parent_id") else None,
                        "mentioned_user": data.get("mentioned_user"),
                        "created_at": current_time,
                        "updated_at": current_time,
                        "status": CommentStatus.ACTIVE.value,
                        "likes": 0,
                        "reply_count": 0,
                        "metadata": {
                            "edited": False,
                            "last_edited_at": None,
                            "original_content": None,
                            "thread_depth": 0 
                        }
                    }

                    # If this is a reply, well get parent comment and set thread depth
                    if data.get("parent_id"):
                        parent_comment = self.find_by_id(data["parent_id"])
                        if parent_comment:
                            comment_data["metadata"]["thread_depth"] = parent_comment["metadata"]["thread_depth"] + 1
                            
                            # Update parent's reply count
                            self.collection.update_one(
                                {"_id": ObjectId(data["parent_id"])},
                                {"$inc": {"reply_count": 1}},
                                session=session
                            )

                    # Insert comment
                    result = self.collection.insert_one(comment_data, session=session)
                    if not result.inserted_id:
                        return None, "Failed to create comment"

                    # Update post comment count if it's a top-level comment
                    if not data.get("parent_id"):
                        posts_collection = self.collection.database.get_collection('posts')
                        update_result = posts_collection.update_one(
                            {"_id": ObjectId(data["post_id"])},
                            {
                                "$inc": {"comment_count": 1},
                                "$set": {"last_activity_at": current_time}
                            },
                            session=session
                        )

                        if update_result.modified_count == 0:
                            return None, "Failed to update post comment count"

                    return str(result.inserted_id), None

        except Exception as e:
            current_app.logger.error(f"Error creating comment: {str(e)}")
            return None, f"Error creating comment: {str(e)}"

    def get_comments_with_replies(
        self,
        post_id: str,
        page: int = 1,
        per_page: int = 20
    ) -> Tuple[List[Dict], int]:
        """Get comments with their replies for a post"""
        try:
            # First get top-level comments (no parent_id right now)
            top_level_query = {
                "post_id": ObjectId(post_id),
                "parent_id": None,
                "status": CommentStatus.ACTIVE.value
            }

            # Calculate skip value for pagination
            skip = (page - 1) * per_page

            # Get total count of top-level comments
            total = self.collection.count_documents(top_level_query)

            # Get paginated top-level comments
            top_level_comments = list(
                self.collection.find(top_level_query)
                .sort("created_at", DESCENDING)
                .skip(skip)
                .limit(per_page)
            )

            # For each top-level comment, get its replies
            result = []
            for comment in top_level_comments:
                # Clean up the comment ObjectIds
                comment["_id"] = str(comment["_id"])
                comment["post_id"] = str(comment["post_id"])
                comment["user_id"] = str(comment["user_id"])

                # Get replies for this comment
                replies_query = {
                    "post_id": ObjectId(post_id),
                    "status": CommentStatus.ACTIVE.value,
                    "$or": [
                        {"parent_id": ObjectId(comment["_id"])},
                        {"_id": ObjectId(comment["_id"])}
                    ]
                }

                replies = list(
                    self.collection.find(replies_query)
                    .sort("created_at", ASCENDING)
                )

                # Clean up reply ObjectIds and add to thread
                thread = []
                for reply in replies:
                    reply["_id"] = str(reply["_id"])
                    reply["post_id"] = str(reply["post_id"])
                    reply["user_id"] = str(reply["user_id"])
                    if reply.get("parent_id"):
                        reply["parent_id"] = str(reply["parent_id"])
                    thread.append(reply)

                result.extend(thread)

            return result, total

        except Exception as e:
            current_app.logger.error(f"Error getting comments: {str(e)}")
            return [], 0

    def update_comment(self, comment_id: str, data: Dict) -> Tuple[bool, Optional[str]]:
        """Update an existing comment"""
        try:
            comment = self.find_by_id(comment_id)
            if not comment:
                return False, "Comment not found"
            
            # Validate update data
            is_valid, errors = self.validate_comment_data(data, is_update=True)
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
            if not comment.get("metadata", {}).get("edited", False):
                update_data["metadata.original_content"] = comment["content"]

            if "content" in data:
                update_data["content"] = data["content"].strip()

            # Update comment in database
            result = self.collection.update_one(
                {"_id": ObjectId(comment_id)},
                {"$set": update_data}
            )

            return result.modified_count > 0, None

        except Exception as e:
            return False, f"Error updating comment: {str(e)}"

    def get_comments_by_post(
        self, 
        post_id: str,
        page: int = 1,
        per_page: int = 20,
        parent_id: Optional[str] = None
    ) -> Tuple[List[Dict], int]:
        """Get paginated comments for a post"""
        try:
            # Build query
            query = {
                "post_id": ObjectId(post_id),
                "status": CommentStatus.ACTIVE.value
            }
            
            # If parent_id is None, get top-level comments
            # If parent_id is provided, get replies to that comment
            if parent_id is not None:
                query["parent_id"] = ObjectId(parent_id)
            else:
                query["parent_id"] = None

            # Calculate skip value for pagination
            skip = (page - 1) * per_page

            total = self.collection.count_documents(query)
            
            # Get comments with pagination
            comments = list(
                self.collection.find(query)
                .sort("created_at", DESCENDING)
                .skip(skip)
                .limit(per_page)
            )

            # Clean up ObjectID fields
            for comment in comments:
                comment["_id"] = str(comment["_id"])
                comment["post_id"] = str(comment["post_id"])
                comment["user_id"] = str(comment["user_id"])
                if comment.get("parent_id"):
                    comment["parent_id"] = str(comment["parent_id"])

            return comments, total

        except Exception as e:
            current_app.logger.error(f"Error getting post comments: {str(e)}")
            return [], 0

    def find_by_id(self, comment_id: str) -> Optional[Dict]:
        """Find comment ID"""
        try:
            return self.collection.find_one({
                "_id": ObjectId(comment_id),
                "status": CommentStatus.ACTIVE.value
            })
        except Exception:
            return None

    def delete_comment(self, comment_id: str) -> Tuple[bool, Optional[str]]:
        """Soft delete a comment"""
        try:
            with self.collection.database.client.start_session() as session:
                with session.start_transaction():
                    comment = self.find_by_id(comment_id)
                    if not comment:
                        return False, "Comment not found"

                    # Soft delete by updating status
                    delete_result = self.collection.update_one(
                        {"_id": ObjectId(comment_id)},
                        {
                            "$set": {
                                "status": CommentStatus.DELETED.value,
                                "updated_at": datetime.utcnow()
                            }
                        },
                        session=session
                    )

                    if delete_result.modified_count == 0:
                        return False, "Failed to delete comment"

                    # Decrement post comment count in post collection
                    posts_collection = self.collection.database.get_collection('posts')
                    post_update = posts_collection.update_one(
                        {"_id": comment["post_id"]},
                        {
                            "$inc": {"comment_count": -1},
                            "$set": {"updated_at": datetime.utcnow()}
                        },
                        session=session
                    )

                    if post_update.modified_count == 0:
                        return False, "Failed to update post comment count"

                    # If this is a reply, update parent comment's reply count
                    if comment.get("parent_id"):
                        parent_update = self.collection.update_one(
                            {"_id": comment["parent_id"]},
                            {"$inc": {"reply_count": -1}},
                            session=session
                        )
                        
                        if parent_update.modified_count == 0:
                            return False, "Failed to update parent comment reply count"

                    return True, None

        except Exception as e:
            current_app.logger.error(f"Error deleting comment: {str(e)}")
            return False, f"Error deleting comment: {str(e)}"

    def validate_comment_data(self, data: Dict, is_update: bool = False) -> Tuple[bool, Optional[str]]:
        """Validate comment data"""
        errors = []

        for field_name, rules in self.COMMENT_FIELDS.items():
            if field_name in data and data[field_name] is not None:
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

    def toggle_like(self, comment_id: str, user_id: str) -> Tuple[bool, Optional[str]]:
        """Toggle like status for a comment"""
        try:
            comment = self.find_by_id(comment_id)
            if not comment:
                return False, "Comment not found"

            # Check if user has already liked
            likes_collection = self.collection.database.get_collection('comment_likes')
            existing_like = likes_collection.find_one({
                "comment_id": ObjectId(comment_id),
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
                            {"_id": ObjectId(comment_id)},
                            {"$inc": {"likes": -1}},
                            session=session
                        )
                        return True, "Like removed"
                    else:
                        # Add like
                        likes_collection.insert_one({
                            "comment_id": ObjectId(comment_id),
                            "user_id": ObjectId(user_id),
                            "created_at": datetime.utcnow()
                        }, session=session)
                        self.collection.update_one(
                            {"_id": ObjectId(comment_id)},
                            {"$inc": {"likes": 1}},
                            session=session
                        )
                        return True, "Comment liked"

        except Exception as e:
            current_app.logger.error(f"Error toggling like: {str(e)}")
            return False, f"Error toggling like: {str(e)}"