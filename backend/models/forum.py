from bson.objectid import ObjectId
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import re
from enum import Enum
from pymongo import ASCENDING, DESCENDING, IndexModel
from pymongo.errors import PyMongoError
from flask import current_app


class ForumStatus(Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"
    DELETED = "deleted"


class ForumVisibility(Enum):
    PUBLIC = "public"
    PRIVATE = "private"


class ForumRole(Enum):
    ADMIN = "admin"
    MODERATOR = "moderator"
    MEMBER = "member"


class ForumCategory(Enum):
    STUDY_GROUP = "study_group"
    LECTURE_NOTES = "general"
    CAREER = "career"
    PROJECT = "project"
    EXAM_PREP = "exam_prep"
    HOMEWORK_HELP = "homework_help"
    Q_AND_A = "q_and_a"


class Forum:
    # Validation patterns
    NAME_PATTERN = r"^[a-zA-Z0-9\s-]+$"
    SLUG_PATTERN = r"^[a-z0-9-]+$"

    # Validation rules
    VALIDATION_RULES = {
        "name": {
            "min_length": 3,
            "max_length": 50,
            "pattern": NAME_PATTERN,
            "error": "Forum name must be 3-50 characters, alphanumeric only",
        },
        "description": {
            "min_length": 10,
            "max_length": 500,
            "error": "Description must be 10-500 characters",
        },
        "tags": {
            "min_items": 1,
            "max_items": 5,
            "allowed_values": [tag.value for tag in ForumCategory],
            "error": "Must include 1-5 valid tags",
        },
    }

    def __init__(self, db, supabase):
        self.collection = db["forums"]
        self.supabase = supabase
        self.cleanup_forum_collection()
        self._setup_indexes()

    def _setup_indexes(self):
        """Set up indexes for faster queries"""
        try:
            self.collection.drop_indexes()

            # Create indexes for frequently queried fields
            indexes = [
                IndexModel([("name", ASCENDING)], unique=True),
                IndexModel([("slug", ASCENDING)], unique=True, sparse=True),
                IndexModel([("creator_id", ASCENDING)]),
                IndexModel([("tags", ASCENDING)]),
                IndexModel([("status", ASCENDING)]),
                IndexModel([("visibility", ASCENDING)]),
                IndexModel([("created_at", DESCENDING)]),
                IndexModel([("last_active", DESCENDING)]),
            ]

            self.collection.create_indexes(indexes)

        except Exception as e:
            current_app.logger.error(f"Error setting up indexes: {str(e)}")

    def cleanup_forum_collection(self):
        """Clean up existing forum data"""
        try:
            # Update all documents with null slugs to have valid slugs
            forums = self.collection.find({"slug": {"$in": [None, ""]}})
            for forum in forums:
                if "name" in forum:
                    slug = self._generate_slug(forum["name"])
                    if slug:
                        self.collection.update_one(
                            {"_id": forum["_id"]}, {"$set": {"slug": slug}}
                        )
        except Exception as e:
            current_app.logger.error(f"Error cleaning up forums: {str(e)}")

    def _generate_slug(self, name: str) -> str:
        """Generate URL-friendly slug from forum name"""
        try:
            # Convert to lowercase and replace spaces/special chars with hyphens
            slug = name.lower().strip()
            # Replace non-alphanumeric characters with hyphens
            slug = re.sub(r"[^\w\s-]", "", slug)
            slug = re.sub(r"[-\s]+", "-", slug)
            # Remove leading/trailing hyphens
            slug = slug.strip("-")

            # Check if slug already exists
            base_slug = slug
            counter = 1
            while self.collection.find_one({"slug": slug}):
                slug = f"{base_slug}-{counter}"
                counter += 1

            return slug
        except Exception as e:
            print(f"Error generating slug: {str(e)}")
            return None

    def validate_forum_data(data: Dict) -> Tuple[bool, List[str]]:
        """Validate forum creation/update data"""
        errors = []

        # Required fields check
        required_fields = {
            "name": "Forum name is required",
            "description": "Description is required",
            "category": "Category is required",
            "tags": "At least one tag is required",
        }

        for field, message in required_fields.items():
            if not data.get(field):
                errors.append(message)

        if errors:
            return False, errors

        # Name validation
        name = data["name"].strip()
        if len(name) < 3:
            errors.append("Forum name must be at least 3 characters")
        if len(name) > 50:
            errors.append("Forum name must not exceed 50 characters")
        if re.search(r"[^a-zA-Z0-9\s\-_]", name):
            errors.append(
                "Forum name can only contain letters, numbers, spaces, hyphens, and underscores"
            )

        # Description validation
        description = data["description"].strip()
        if len(description) < 10:
            errors.append("Description must be at least 10 characters")
        if len(description) > 500:
            errors.append("Description must not exceed 500 characters")

        # Category validation
        try:
            ForumCategory(data["category"])
        except ValueError:
            valid_categories = ", ".join(c.value for c in ForumCategory)
            errors.append(f"Invalid category. Must be one of: {valid_categories}")

        # Tags validation
        tags = data.get("tags", [])
        if not isinstance(tags, list):
            errors.append("Tags must be a list")
        else:
            if len(tags) > 5:
                errors.append("Maximum 5 tags allowed")
            if len(tags) < 1:
                errors.append("At least one tag is required")

            seen_tags = set()
            for tag in tags:
                if not isinstance(tag, str):
                    errors.append(f"Tag must be a string: {tag}")
                    continue

                tag = tag.strip().lower()
                if not tag:
                    errors.append("Empty tags are not allowed")
                    continue

                if tag in seen_tags:
                    errors.append(f"Duplicate tag: {tag}")
                    continue

                seen_tags.add(tag)

                if len(tag) < 2:
                    errors.append(f"Tag '{tag}' must be at least 2 characters")
                if len(tag) > 20:
                    errors.append(f"Tag '{tag}' must not exceed 20 characters")

        if "visibility" in data:
            try:
                ForumVisibility(data["visibility"])
            except ValueError:
                valid_visibilities = ", ".join(v.value for v in ForumVisibility)
                errors.append(
                    f"Invalid visibility. Must be one of: {valid_visibilities}"
                )

        return len(errors) == 0, errors

    def _validate_category(self, category: str) -> Tuple[bool, Optional[str]]:
        """Validate forum category"""
        valid_categories = [c.value for c in ForumCategory]
        if category not in valid_categories:
            return (
                False,
                f"Invalid category. Must be one of: {', '.join(valid_categories)}",
            )
        return True, None

    def create_forum(self, data: Dict) -> Tuple[Optional[str], Optional[str]]:
        """Create a new forum with enhanced validation and metadata"""
        try:
            current_app.logger.debug("Starting forum creation process")

            # Generate slug
            current_app.logger.debug("Generating slug...")
            slug = self._generate_slug(data["name"])
            if not slug:
                return None, "Error generating forum URL"
            current_app.logger.debug(f"Generated slug: {slug}")

            current_app.logger.debug(f"Validating category: {data.get('category')}")
            is_valid_category, category_error = self._validate_category(
                data.get("category", "")
            )
            if not is_valid_category:
                return None, category_error

            visibility = data.get("visibility", ForumVisibility.PUBLIC.value)
            if visibility not in [v.value for v in ForumVisibility]:
                return (
                    None,
                    f"Invalid visibility. Must be one of: {', '.join(v.value for v in ForumVisibility)}",
                )

            current_time = datetime.utcnow()

            # Prepare forum document
            forum_data = {
                "name": data["name"],
                "slug": slug,
                "description": data["description"],
                "tags": data["tags"],
                "creator_id": data["creator_id"],
                "created_at": current_time,
                "updated_at": current_time,
                "last_active": current_time,
                "status": ForumStatus.ACTIVE.value,
                "visibility": visibility,
                "category": data["category"],
                "member_count": 1,
                "post_count": 0,
                "members": [
                    {
                        "user_id": data["creator_id"],
                        "role": ForumRole.ADMIN.value,
                        "joined_at": current_time,
                        "status": "active",
                    }
                ],
                "metadata": {"views": 0, "trending_score": 0, "last_post_date": None},
            }

            # Add optional fields
            if "rules" in data:
                forum_data["rules"] = data["rules"]

            current_app.logger.debug(f"Prepared forum data: {forum_data}")

            # Insert forum
            try:
                result = self.collection.insert_one(forum_data)
                if not result.inserted_id:
                    return None, "Failed to create forum - no ID returned"

                current_app.logger.debug(
                    f"Successfully created forum with ID: {result.inserted_id}"
                )
                return str(result.inserted_id), None

            except PyMongoError as e:
                error_msg = f"Database error: {str(e)}"
                current_app.logger.error(f"MongoDB error: {error_msg}")
                return None, error_msg

        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            current_app.logger.error(f"Error in create_forum: {error_msg}")
            return None, error_msg

    def _validate_update_data(self, data: Dict) -> Tuple[bool, Optional[str]]:
        """Validate forum update data"""
        try:
            if not data:
                return False, "No update data provided"

            errors = []

            # Name validation
            if "name" in data:
                name = data["name"].strip()
                if len(name) < 3:
                    errors.append("Forum name must be at least 3 characters")
                if len(name) > 50:
                    errors.append("Forum name must not exceed 50 characters")
                if re.search(r"[^a-zA-Z0-9\s\-_]", name):
                    errors.append(
                        "Forum name can only contain letters, numbers, spaces, hyphens, and underscores"
                    )

            # Description validation
            if "description" in data:
                description = data["description"].strip()
                if len(description) < 10:
                    errors.append("Description must be at least 10 characters")
                if len(description) > 500:
                    errors.append("Description must not exceed 500 characters")

            # Tags validation
            if "tags" in data:
                tags = data["tags"]
                if not isinstance(tags, list):
                    errors.append("Tags must be a list")
                elif len(tags) > 5:
                    errors.append("Maximum 5 tags allowed")
                elif len(tags) < 1:
                    errors.append("At least one tag is required")
                else:
                    seen_tags = set()
                    for tag in tags:
                        if not isinstance(tag, str):
                            errors.append(f"Tag must be a string: {tag}")
                            continue

                        tag = tag.strip().lower()
                        if not tag:
                            errors.append("Empty tags are not allowed")
                            continue

                        if tag in seen_tags:
                            errors.append(f"Duplicate tag: {tag}")
                            continue

                        seen_tags.add(tag)

                        if len(tag) < 2:
                            errors.append(f"Tag '{tag}' must be at least 2 characters")
                        if len(tag) > 20:
                            errors.append(f"Tag '{tag}' must not exceed 20 characters")

            # Visibility validation
            if "visibility" in data:
                visibility = data["visibility"]
                if visibility not in [v.value for v in ForumVisibility]:
                    errors.append(
                        f"Invalid visibility. Must be one of: {', '.join(v.value for v in ForumVisibility)}"
                    )

            # Rules validation
            if "rules" in data and data["rules"]:
                rules = data["rules"].strip()
                if len(rules) > 1000:
                    errors.append("Rules must not exceed 1000 characters")

            return len(errors) == 0, "\n".join(errors) if errors else None

        except Exception as e:
            return False, f"Validation error: {str(e)}"

    def update_forum(
        self, forum_id: str, data: Dict, user_id: str
    ) -> Tuple[bool, Optional[str]]:
        """Update forum with validation and permission check"""
        try:
            forum = self.find_by_id(forum_id)
            if not forum:
                return False, "Forum not found"

            # Check permissions
            member = next(
                (m for m in forum["members"] if m["user_id"] == user_id), None
            )
            if not member or member["role"] != ForumRole.ADMIN.value:
                return False, "Unauthorized to update forum"

            # Validate update data
            is_valid, error = self._validate_update_data(data)
            if not is_valid:
                return False, error

            # Prepare update data
            update_data = {"updated_at": datetime.utcnow()}

            # Handle name update and slug generation
            if "name" in data:
                new_name = data["name"].strip()
                # Check if new name is different from current
                if new_name != forum["name"]:
                    # Check if new name exists
                    existing = self.find_by_name(new_name)
                    if existing and str(existing["_id"]) != forum_id:
                        return False, "A forum with this name already exists"
                    update_data["name"] = new_name
                    update_data["slug"] = self._generate_slug(new_name)

            # other fields
            fields_to_update = [
                "description",
                "tags",
                "visibility",
                "rules",
                "avatar_url",
                "banner_url",
            ]

            for field in fields_to_update:
                if field in data:
                    update_data[field] = data[field]

            # Update the forum
            result = self.collection.update_one(
                {"_id": ObjectId(forum_id)}, {"$set": update_data}
            )

            if result.modified_count == 0:
                return False, "No changes made to forum"

            return True, None

        except Exception as e:
            current_app.logger.error(f"Error updating forum: {str(e)}")
            return False, f"Error updating forum: {str(e)}"

    def find_by_slug(self, slug: str) -> Optional[Dict]:
        """Find forum by slug"""
        return self.collection.find_one({"slug": slug})

    def get_forum_stats(self, forum_id: str) -> Optional[Dict]:
        """Get forum statistics"""
        try:
            forum = self.find_by_id(forum_id)
            if not forum:
                return None

            return {
                "member_count": forum["member_count"],
                "post_count": forum["post_count"],
                "views": forum["metadata"]["views"],
                "trending_score": forum["metadata"]["trending_score"],
                "last_active": forum["last_active"],
                "creation_date": forum["created_at"],
            }
        except Exception:
            return None

    def get_member_role(self, forum_id: str, user_id: str) -> Optional[str]:
        """Get member's role in forum"""
        try:
            forum = self.find_by_id(forum_id)
            if not forum:
                return None

            member = next(
                (m for m in forum["members"] if m["user_id"] == user_id), None
            )
            return member["role"] if member else None
        except Exception:
            return None

    def find_by_name(self, name):
        return self.collection.find_one({"name": name})

    def find_by_id(self, forum_id):
        try:
            object_id = ObjectId(forum_id)
            return self.collection.find_one({"_id": object_id})
        except Exception:
            return None

    def add_member(
        self, forum_id: str, user_id: str, role: str = ForumRole.MEMBER.value
    ) -> Tuple[bool, Optional[str]]:
        """Add member to forum with specified role"""
        try:
            forum = self.find_by_id(forum_id)
            if not forum:
                return False, "Forum not found"

            # Check if already a member
            if any(m["user_id"] == user_id for m in forum["members"]):
                return False, "User is already a member"

            # Add member
            member_data = {
                "user_id": user_id,
                "role": role,
                "joined_at": datetime.utcnow(),
                "status": "active",
            }

            result = self.collection.update_one(
                {"_id": ObjectId(forum_id)},
                {
                    "$push": {"members": member_data},
                    "$inc": {"member_count": 1},
                    "$set": {"updated_at": datetime.utcnow()},
                },
            )

            return result.modified_count > 0, None

        except Exception as e:
            return False, f"Error adding member: {str(e)}"

    def remove_member(self, forum_id: str, user_id: str) -> Tuple[bool, Optional[str]]:
        """Remove member from forum"""
        try:
            forum = self.find_by_id(forum_id)
            if not forum:
                return False, "Forum not found"

            # Cannot remove creator
            if user_id == forum["creator_id"]:
                return False, "Cannot remove forum creator"

            result = self.collection.update_one(
                {"_id": ObjectId(forum_id)},
                {
                    "$pull": {"members": {"user_id": user_id}},
                    "$inc": {"member_count": -1},
                    "$set": {"updated_at": datetime.utcnow()},
                },
            )

            return result.modified_count > 0, None

        except Exception as e:
            return False, f"Error removing member: {str(e)}"

    def update_member_role(
        self, forum_id: str, user_id: str, new_role: str
    ) -> Tuple[bool, Optional[str]]:
        """Update member's role"""
        try:
            if new_role not in [role.value for role in ForumRole]:
                return False, "Invalid role"

            forum = self.find_by_id(forum_id)
            if not forum:
                return False, "Forum not found"

            # Cannot change creator's role
            if user_id == forum["creator_id"]:
                return False, "Cannot change forum creator's role"

            result = self.collection.update_one(
                {"_id": ObjectId(forum_id), "members.user_id": user_id},
                {"$set": {"members.$.role": new_role, "updated_at": datetime.utcnow()}},
            )

            return result.modified_count > 0, None

        except Exception as e:
            return False, f"Error updating member role: {str(e)}"

    def delete_forum(self, forum_id: str) -> Tuple[bool, Optional[str]]:
        """Permanently delete a forum"""
        try:
            result = self.collection.delete_one({"_id": ObjectId(forum_id)})
            if result.deleted_count == 0:
                return False, "Forum not found"
            return True, None

        except Exception as e:
            current_app.logger.error(f"Error deleting forum: {str(e)}")
            return False, f"Error deleting forum: {str(e)}"
