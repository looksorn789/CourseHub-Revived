from datetime import datetime
from enum import Enum
from typing import Dict, Optional, Tuple, List
from bson import ObjectId
from flask import current_app
import bleach
from pymongo import ASCENDING, DESCENDING, IndexModel

class CommentStatus(Enum):
    ACTIVE = "active"
    DELETED = "deleted"
    HIDDEN = "hidden"

class Comment:
    _prepared_dbs = set()

    ALLOWED_HTML_TAGS = ["p", "br", "strong", "em", "u", "code", "pre", "blockquote"]

    FIELDS = {
        "content": {
            "type": str,
            "required": True,
            "min_length": 1,
            "max_length": 5000,
            "error": "Content must be between 1 and 5000 characters"
        },
        "post_id": {
            "type": str,
            "required": True,
            "error": "Post ID is required"
        },
        "user_id": {
            "type": str,
            "required": True,
            "error": "User ID is required"
        },
        "parent_id": {
            "type": str,
            "required": False,
            "error": "Invalid parent comment ID"
        }
    }

    def __init__(self, db, supabase):
        self.collection = db["threads"]
        self.supabase = supabase
        # Index setup is slow over the network and only needs to happen once
        # per process; a model is constructed on every request.
        if db.name not in Comment._prepared_dbs:
            self._setup_indexes()
            Comment._prepared_dbs.add(db.name)

    def _setup_indexes(self):
        """Set up optimized indexes for comment queries"""
        try:
            indexes = [
                IndexModel([("post_id", ASCENDING), ("parent_id", ASCENDING),
                          ("status", ASCENDING), ("created_at", DESCENDING)]),
                IndexModel([("user_id", ASCENDING)]),
                IndexModel([("parent_id", ASCENDING)]),
                IndexModel([("likes", DESCENDING)]),
                IndexModel([("created_at", DESCENDING)])
            ]

            self.collection.create_indexes(indexes)
            current_app.logger.info("Comment indexes created successfully")

        except Exception as e:
            current_app.logger.error(f"Error setting up comment indexes: {str(e)}")

    def _clean_content(self, content: str) -> str:
        """Clean and sanitize comment content"""
        return bleach.clean(
            str(content).strip(),
            tags=self.ALLOWED_HTML_TAGS,
            strip=True
        )

    def _prepare_comment_data(self, data: Dict) -> Dict:
        """Prepare comment data for insertion"""
        current_time = datetime.utcnow()

        comment_data = {
            "post_id": ObjectId(data["post_id"]),
            "user_id": ObjectId(data["user_id"]),
            "content": self._clean_content(data["content"]),
            "parent_id": ObjectId(data["parent_id"]) if data.get("parent_id") else None,
            "created_at": current_time.strftime('%Y-%m-%dT%H:%M:%S.%fZ'),
            "updated_at": current_time.strftime('%Y-%m-%dT%H:%M:%S.%fZ'),
            "last_activity_at": current_time.strftime('%Y-%m-%dT%H:%M:%S.%fZ'),
            "status": CommentStatus.ACTIVE.value,
            "likes": 0,
            "reply_count": 0,
            "metadata": {
                "edited": False,
                "last_edited_at": None,
                "original_content": None,
                "thread_depth": 0,
                "mentioned_users": data.get("mentioned_users", [])
            }
        }

        return comment_data

    def _convert_ids_to_strings(self, doc: Dict):
        """Convert ObjectIds to strings in a document"""
        for key, value in doc.items():
            if isinstance(value, ObjectId):
                doc[key] = str(value)
            elif isinstance(value, dict):
                self._convert_ids_to_strings(value)

    def get_comment_with_user(self, comment_id: str) -> Optional[Dict]:
        """Get single comment with user info"""
        try:
            pipeline = [
                {"$match": {"_id": ObjectId(comment_id)}},
                {"$lookup": {
                    "from": "users",
                    "localField": "user_id",
                    "foreignField": "_id",
                    "as": "user"
                }},
                {"$unwind": "$user"},
                {"$project": {
                    "_id": 1,
                    "content": 1,
                    "post_id": 1,
                    "parent_id": 1,
                    "created_at": 1,
                    "updated_at": 1,
                    "status": 1,
                    "likes": 1,
                    "reply_count": 1,
                    "metadata": 1,
                    "user_info": {
                        "id": "$user._id",
                        "username": "$user.username",
                        "profile": "$user.profile"
                    }
                }}
            ]

            comment = next(self.collection.aggregate(pipeline), None)
            if comment:
                self._convert_ids_to_strings(comment)
                return comment

            return None
        except Exception as e:
            current_app.logger.error(f"Error getting comment: {str(e)}")
            return None

    def create_comment(self, data: Dict) -> Tuple[Optional[Dict], Optional[str]]:
        """Create a new comment or reply"""
        try:
            with self.collection.database.client.start_session() as session:
                with session.start_transaction():
                    current_app.logger.debug("Starting transaction for comment creation")

                    comment_data = self._prepare_comment_data(data)
                    current_app.logger.debug(f"Prepared comment data: {comment_data}")

                    # Insert comment first
                    current_app.logger.debug("Inserting new comment")
                    result = self.collection.insert_one(comment_data, session=session)

                    if not result.inserted_id:
                        return None, "Failed to create comment"

                    # Update post if top-level comment
                    if not data.get("parent_id"):
                        current_app.logger.debug("Updating post comment count")
                        posts_collection = self.collection.database.get_collection('posts')
                        posts_collection.update_one(
                            {"_id": ObjectId(data["post_id"])},
                            {
                                "$inc": {"comment_count": 1},
                                "$set": {"last_activity_at": comment_data["created_at"]}
                            },
                            session=session
                        )

                    # If reply, update parent
                    if data.get("parent_id"):
                        parent = self.collection.find_one(
                            {"_id": ObjectId(data["parent_id"])}
                        )
                        if parent:
                            comment_data["metadata"]["thread_depth"] = parent["metadata"]["thread_depth"] + 1

                            self.collection.update_one(
                                {"_id": ObjectId(data["parent_id"])},
                                {
                                    "$inc": {"reply_count": 1},
                                    "$set": {"last_activity_at": comment_data["created_at"]}
                                },
                                session=session
                            )

                    current_app.logger.debug("Fetching user info")
                    users_collection = self.collection.database.get_collection('users')
                    user = users_collection.find_one(
                        {"_id": ObjectId(data["user_id"])},
                        {"username": 1, "profile": 1},
                        session=session
                    )

                    # Prepare response data
                    response_data = {
                        "_id": str(result.inserted_id),
                        "post_id": str(comment_data["post_id"]),
                        "user_id": str(comment_data["user_id"]),
                        "content": comment_data["content"],
                        "parent_id": str(comment_data["parent_id"]) if comment_data.get("parent_id") else None,
                        "created_at": comment_data["created_at"],
                        "updated_at": comment_data["updated_at"],
                        "last_activity_at": comment_data["last_activity_at"],
                        "status": comment_data["status"],
                        "likes": comment_data["likes"],
                        "reply_count": comment_data["reply_count"],
                        "metadata": comment_data["metadata"],
                    }

                    if user:
                        response_data["user_info"] = {
                            "username": user.get("username"),
                            "profile": user.get("profile")
                        }

                    current_app.logger.debug(f"Successfully created comment: {response_data}")
                    return response_data, None

        except Exception as e:
            current_app.logger.error(f"Error creating comment: {str(e)}")
            current_app.logger.exception(e)
            return None, str(e)

    def get_comments_with_threads(
        self,
        post_id: str,
        page: int = 1,
        per_page: int = 20,
        sort_by: str = "recent"
    ) -> Tuple[List[Dict], int]:
        """Get paginated comments with their replies"""
        try:
            #  sort configuration
            sort_config = {
                "recent": {"created_at": -1},
                "likes": {"likes": -1},
                "replies": {"reply_count": -1}
            }.get(sort_by, {"created_at": -1})

            pipeline = [
                # Match top-level comments
                {"$match": {
                    "post_id": ObjectId(post_id),
                    "parent_id": None,
                    "status": CommentStatus.ACTIVE.value
                }},
                # sorting
                {"$sort": sort_config},
                # Pagination
                {"$skip": (page - 1) * per_page},
                {"$limit": per_page},
                # Get replies
                {"$lookup": {
                    "from": "threads",
                    "let": {"comment_id": "$_id"},
                    "pipeline": [
                        {"$match": {
                            "$expr": {"$eq": ["$parent_id", "$$comment_id"]},
                            "status": CommentStatus.ACTIVE.value
                        }},
                        {"$sort": {"created_at": 1}},
                        # Get user info for replies
                        {"$lookup": {
                            "from": "users",
                            "localField": "user_id",
                            "foreignField": "_id",
                            "as": "user"
                        }},
                        {"$unwind": "$user"},
                        {"$project": {
                            "_id": 1,
                            "content": 1,
                            "user_id": 1,
                            "created_at": 1,
                            "updated_at": 1,
                            "likes": 1,
                            "metadata": 1,
                            "user_info": {
                                "username": "$user.username",
                                "profile": "$user.profile"
                            }
                        }}
                    ],
                    "as": "replies"
                }},
                # Get user info for main comments
                {"$lookup": {
                    "from": "users",
                    "localField": "user_id",
                    "foreignField": "_id",
                    "as": "user"
                }},
                {"$unwind": "$user"},
                # Final structure
                {"$project": {
                    "_id": 1,
                    "content": 1,
                    "user_id": 1,
                    "post_id": 1,
                    "created_at": 1,
                    "updated_at": 1,
                    "likes": 1,
                    "reply_count": 1,
                    "metadata": 1,
                    "user_info": {
                        "username": "$user.username",
                        "profile": "$user.profile"
                    },
                    "replies": 1
                }}
            ]

            # Get total count
            total = self.collection.count_documents({
                "post_id": ObjectId(post_id),
                "parent_id": None,
                "status": CommentStatus.ACTIVE.value
            })

            # Execute aggregation pipeline
            comments = list(self.collection.aggregate(pipeline))

            # Convert ObjectIds to strings
            for comment in comments:
                self._convert_ids_to_strings(comment)
                for reply in comment.get("replies", []):
                    self._convert_ids_to_strings(reply)

            return comments, total

        except Exception as e:
            current_app.logger.error(f"Error getting comments: {str(e)}")
            return [], 0

    def update_comment(
        self,
        comment_id: str,
        user_id: str,
        content: str
    ) -> Tuple[Optional[Dict], Optional[str]]:
        """Update a comment or reply"""
        try:
            with self.collection.database.client.start_session() as session:
                with session.start_transaction():
                    # Find the comment/reply and validate ownership
                    comment = self.collection.find_one({
                        "_id": ObjectId(comment_id),
                        "user_id": ObjectId(user_id),
                        "status": "active"
                    }, session=session)

                    if not comment:
                        return None, "Comment not found or unauthorized"

                    # Logging whether we're updating a comment or reply (for debugging)
                    comment_type = "reply" if comment.get("parent_id") else "comment"
                    current_app.logger.debug(f"Updating {comment_type} {comment_id}")

                    current_time = datetime.utcnow()
                    update_data = {
                        "content": self._clean_content(content),
                        "updated_at": current_time,
                        "metadata.edited": True,
                        "metadata.last_edited_at": current_time
                    }

                    # Store original content on first edit
                    if not comment["metadata"].get("edited"):
                        update_data["metadata.original_content"] = comment["content"]

                    result = self.collection.find_one_and_update(
                        {"_id": ObjectId(comment_id)},
                        {"$set": update_data},
                        return_document=True,
                        session=session
                    )

                    if not result:
                        return None, f"Failed to update {comment_type}"

                    response_data = self._format_comment_response(result)

                    return response_data, None

        except Exception as e:
            current_app.logger.error(f"Error updating comment/reply: {str(e)}")
            return None, str(e)

    def delete_comment(
        self,
        comment_id: str,
        user_id: str
    ) -> Tuple[bool, Optional[str]]:
        """Delete a comment/reply and its associated content"""
        try:
            with self.collection.database.client.start_session() as session:
                with session.start_transaction():
                    # Find and validate ownership
                    comment = self.collection.find_one({
                        "_id": ObjectId(comment_id),
                        "user_id": ObjectId(user_id),
                        "status": "active"
                    }, session=session)

                    if not comment:
                        return False, "Comment not found or unauthorized"

                    is_reply = bool(comment.get("parent_id"))

                    if is_reply:
                        # Delete single reply
                        self.collection.delete_one({"_id": ObjectId(comment_id)}, session=session)

                        # Update parent's reply count
                        self.collection.update_one(
                            {"_id": comment["parent_id"]},
                            {
                                "$inc": {"reply_count": -1},
                                "$set": {"updated_at": datetime.utcnow()}
                            },
                            session=session
                        )
                    else:
                        # Delete comment and all its replies
                        self.collection.delete_many({
                            "$or": [
                                {"_id": ObjectId(comment_id)},
                                {"parent_id": ObjectId(comment_id)}
                            ]
                        }, session=session)

                        # Update post's comment count
                        posts_collection = self.collection.database.get_collection('posts')
                        posts_collection.update_one(
                            {"_id": comment["post_id"]},
                            {
                                "$inc": {"comment_count": -1},
                                "$set": {"updated_at": datetime.utcnow()}
                            },
                            session=session
                        )

                    # Delete associated likes
                    likes_collection = self.collection.database.get_collection('comment_likes')
                    likes_collection.delete_many({"comment_id": ObjectId(comment_id)}, session=session)

                    return True, None

        except Exception as e:
            current_app.logger.error(f"Error deleting comment/reply: {str(e)}")
            return False, str(e)

    def _format_comment_response(self, comment: Dict) -> Dict:
        """Helper method to format comment/reply response"""
        response = {
            "_id": str(comment["_id"]),
            "content": comment["content"],
            "user_id": str(comment["user_id"]),
            "created_at": comment["created_at"],
            "updated_at": comment["updated_at"],
            "likes": comment["likes"],
            "metadata": comment["metadata"],
        }

        if comment.get("parent_id"):
            response["parent_id"] = str(comment["parent_id"])

        # Add user info
        users_collection = self.collection.database.get_collection('users')
        user = users_collection.find_one(
            {"_id": comment["user_id"]},
            {"username": 1, "profile": 1}
        )
        if user:
            response["user_info"] = {
                "username": user.get("username"),
                "profile": user.get("profile")
            }

        return response

    def toggle_like(
        self,
        comment_id: str,
        user_id: str
    ) -> Tuple[bool, Optional[str]]:
        """Toggle like status for a comment"""
        try:
            with self.collection.database.client.start_session() as session:
                with session.start_transaction():
                    # Check if like exists
                    likes_collection = self.collection.database.get_collection('comment_likes')
                    existing_like = likes_collection.find_one({
                        "comment_id": ObjectId(comment_id),
                        "user_id": ObjectId(user_id)
                    }, session=session)

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
            return False, str(e)

    def get_user_comment_likes(
        self,
        user_id: str,
        comment_ids: List[str]
    ) -> List[str]:
        """Get list of comments liked by user"""
        try:
            likes_collection = self.collection.database.get_collection('comment_likes')
            liked_comments = list(likes_collection.find({
                "user_id": ObjectId(user_id),
                "comment_id": {"$in": [ObjectId(cid) for cid in comment_ids]}
            }).distinct("comment_id"))

            return [str(comment_id) for comment_id in liked_comments]

        except Exception as e:
            current_app.logger.error(f"Error getting user likes: {str(e)}")
            return []

    def find_by_id(self, comment_id: str) -> Optional[Dict]:
        """Find comment by ID with error handling"""
        try:
            comment = self.collection.find_one({
                "_id": ObjectId(comment_id),
                "status": CommentStatus.ACTIVE.value
            })

            if comment:
                self._convert_ids_to_strings(comment)

            return comment

        except Exception as e:
            current_app.logger.error(f"Error finding comment: {str(e)}")
            return None
