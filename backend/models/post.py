import re
from datetime import datetime
from enum import Enum
from typing import Dict, Optional, Tuple
from bson import ObjectId
from flask import current_app


class PostStatus(Enum):
    ACTIVE = "active"
    DELETED = "deleted"
    ARCHIVED = "archived"


class PostType(Enum):
    DISCUSSION = "discussion"
    QUESTION = "question"


class Post:
    _prepared_dbs = set()

    # Validation patterns
    TITLE_PATTERN = r"^[a-zA-Z0-9\s\-_.,!?'\"()]{3,150}$"

    # Field validation rules
    POST_FIELDS = {
        "title": {
            "type": str,
            "required": True,
            "min_length": 3,
            "max_length": 150,
            "pattern": TITLE_PATTERN,
            "error": "Title must be 3-150 characters and contain only letters, numbers, and basic punctuation",
        },
        "content": {
            "type": str,
            "required": True,
            "min_length": 10,
            "max_length": 50000,
            "error": "Content must be between 10 and 50000 characters",
        },
        "type": {
            "type": str,
            "required": True,
            "allowed_values": [t.value for t in PostType],
            "error": f"Type must be one of: {', '.join(t.value for t in PostType)}",
        },
        "tags": {
            "type": list,
            "required": False,
            "max_items": 5,
            "error": "Maximum 5 tags allowed"
        },
        "forum_id": {
            "type": str,
            "required": True,
            "error": "Forum ID is required",
        },
    }

    def __init__(self, db, supabase):
        self.collection = db["posts"]
        self.supabase = supabase
        # Index setup is slow over the network and only needs to happen once
        # per process; a model is constructed on every request.
        if db.name not in Post._prepared_dbs:
            self._setup_indexes()
            Post._prepared_dbs.add(db.name)

    def _setup_indexes(self):
        """Set up indexes for faster queries"""
        try:
            indexes = [
                ("forum_id", 1),
                ("user_id", 1),
                ("created_at", -1),
                ("type", 1),
                ("status", 1),
                ("view_count", -1),
                ("last_activity_at", -1),
                [("title", "text"), ("content", "text")]
            ]

            for index in indexes:
                if isinstance(index, tuple):
                    self.collection.create_index([index])
                else:
                    self.collection.create_index(index)

        except Exception as e:
            print(f"Error setting up indexes: {str(e)}")

    def create_post(self, data: Dict) -> Tuple[Optional[str], Optional[str]]:
        """Create a new post"""
        try:
            with self.collection.database.client.start_session() as session:
                with session.start_transaction():
                    # Validate post data
                    is_valid, errors = self.validate_post_data(data)
                    if not is_valid:
                        return None, errors

                    current_time = datetime.utcnow()

                    # Prepare post document
                    post_data = {
                        "forum_id": ObjectId(data["forum_id"]),
                        "user_id": ObjectId(data["user_id"]),
                        "title": data["title"].strip(),
                        "content": data["content"].strip(),
                        "type": data["type"],
                        "tags": data.get("tags", [])[:5],
                        "created_at": current_time,
                        "updated_at": current_time,
                        "last_activity_at": current_time,
                        "view_count": 0,
                        "comment_count": 0,
                        "images": [],
                        "metadata": {
                            "last_edited_by": None,
                            "last_edited_at": None,
                            "edit_history": [],
                        }
                    }

                    # Insert post
                    result = self.collection.insert_one(post_data, session=session)
                    if not result.inserted_id:
                        return None, "Failed to create post"

                    # Update forum post count and last activity
                    forums_collection = self.collection.database.get_collection('forums')
                    update_result = forums_collection.update_one(
                        {"_id": ObjectId(data["forum_id"])},
                        {
                            "$inc": {"post_count": 1},
                            "$set": {
                                "last_activity": current_time,
                                "updated_at": current_time
                            }
                        },
                        session=session
                    )

                    if update_result.modified_count == 0:
                        return None, "Failed to update forum post count"

                    return str(result.inserted_id), None

        except Exception as e:
            current_app.logger.error(f"Error creating post: {str(e)}")
            return None, f"Error creating post: {str(e)}"

    def update_post(self, post_id: str, data: Dict, editor_id: str) -> Tuple[bool, Optional[str]]:
        """Update an existing post"""
        try:
            post = self.find_by_id(post_id)
            if not post:
                return False, "Post not found"

            # Validate update data
            is_valid, errors = self.validate_post_data(data, is_update=True)
            if not is_valid:
                return False, errors

            current_time = datetime.utcnow()

            # Store previous version in edit history
            edit_history_entry = {
                "editor_id": ObjectId(editor_id),
                "edited_at": current_time,
                "previous_title": post["title"],
                "previous_content": post["content"],
                "previous_type": post.get("type"),
                "previous_tags": post.get("tags", [])
            }

            # Prepare data
            update_data = {
                "updated_at": current_time,
                "last_activity_at": current_time,
                "metadata.last_edited_by": ObjectId(editor_id),
                "metadata.last_edited_at": current_time,
            }

            # Update fields
            if "title" in data:
                update_data["title"] = data["title"].strip()
            if "content" in data:
                update_data["content"] = data["content"].strip()
            if "type" in data:
                update_data["type"] = data["type"]
            if "tags" in data:
                update_data["tags"] = data["tags"][:5]

            # Update the post
            result = self.collection.update_one(
                {"_id": ObjectId(post_id)},
                {
                    "$set": update_data,
                    "$push": {"metadata.edit_history": edit_history_entry}
                }
            )

            if result.modified_count == 0:
                return False, "No changes made to the post"

            # Fetch the updated post to ensure we have all the latest data
            updated_post = self.collection.find_one({"_id": ObjectId(post_id)})
            if not updated_post:
                return False, "Failed to retrieve updated post"

            return True, None

        except Exception as e:
            return False, f"Error updating post: {str(e)}"

    def validate_post_data(self, data: Dict, is_update: bool = False) -> Tuple[bool, Optional[str]]:
        """Validate post data"""
        errors = []

        for field_name, rules in self.POST_FIELDS.items():
            if field_name in data:
                # Type validation
                if not isinstance(data[field_name], rules["type"]):
                    errors.append(f"{field_name} must be of type {rules['type'].__name__}")
                    continue

                # List validations
                if field_name == "tags":
                    if len(data[field_name]) > rules["max_items"]:
                        errors.append(rules["error"])

                # String validations
                if isinstance(data[field_name], str):
                    if "min_length" in rules and len(data[field_name].strip()) < rules["min_length"]:
                        errors.append(f"{field_name} must be at least {rules['min_length']} characters")
                    if "max_length" in rules and len(data[field_name].strip()) > rules["max_length"]:
                        errors.append(f"{field_name} must not exceed {rules['max_length']} characters")
                    if "pattern" in rules and not re.match(rules["pattern"], data[field_name]):
                        errors.append(rules["error"])

                # Allowed values validation
                if "allowed_values" in rules and data[field_name] not in rules["allowed_values"]:
                    errors.append(f"{field_name} must be one of: {', '.join(rules['allowed_values'])}")

            elif rules.get("required", False) and not is_update:
                errors.append(f"{field_name} is required")

        return len(errors) == 0, "\n".join(errors) if errors else None

    def find_by_id(self, post_id: str) -> Optional[Dict]:
        """Find post by ID"""
        try:
            return self.collection.find_one({"_id": ObjectId(post_id)})
        except Exception:
            return None

    def increment_view_count(self, post_id: str) -> bool:
        """Increment post view count"""
        try:
            result = self.collection.update_one(
                {"_id": ObjectId(post_id)},
                {"$inc": {"view_count": 1}}
            )
            return result.modified_count > 0
        except Exception:
            return False

    def delete_post(self, post_id: str) -> Tuple[bool, Optional[str]]:
        """Delete a post"""
        try:
            with self.collection.database.client.start_session() as session:
                with session.start_transaction():
                    post = self.find_by_id(post_id)
                    if not post:
                        return False, "Post not found"

                    delete_result = self.collection.delete_one(
                        {"_id": ObjectId(post_id)},
                        session=session
                    )

                    if delete_result.deleted_count == 0:
                        return False, "Failed to delete post"

                    # Decrement forum post count in the forum collection
                    forums_collection = self.collection.database.get_collection('forums')
                    forum_update = forums_collection.update_one(
                        {"_id": post["forum_id"]},
                        {
                            "$inc": {"post_count": -1},
                            "$set": {"updated_at": datetime.utcnow()}
                        },
                        session=session
                    )

                    if forum_update.modified_count == 0:
                        return False, "Failed to update forum post count"

                    return True, None

        except Exception as e:
            current_app.logger.error(f"Error deleting post: {str(e)}")
            return False, f"Error deleting post: {str(e)}"

    def get_forum_posts(
            self,
            forum_id: str,
            page: int = 1,
            per_page: int = 20,
            post_type: Optional[str] = None
        ) -> Tuple[list, int]:
        """Get paginated posts for a forum"""
        try:
            # Build query
            query = {
                "forum_id": ObjectId(forum_id)
            }

            if post_type:
                query["type"] = post_type

            # Execute query
            total = self.collection.count_documents(query)
            posts = list(
                self.collection.find(query)
                .sort("last_activity_at", -1)
                .skip((page - 1) * per_page)
                .limit(per_page)
            )

            return posts, total

        except Exception as e:
            current_app.logger.error(f"Error getting forum posts: {str(e)}")
            return [], 0
