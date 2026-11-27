import traceback
from datetime import datetime
from typing import Optional, Dict, Tuple
from flask import Blueprint, request, jsonify, current_app
from bson import ObjectId
from bson.errors import InvalidId
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from pymongo import WriteConcern
from models.forum import Forum, ForumRole, ForumStatus, ForumVisibility, ForumCategory
from models.user import UserModel
import bleach
from utils.helpers import get_user_id
from utils.storage import CHANNEL_IMAGE_BUCKET, read_image_upload, remove_images, upload_image


forum_bp = Blueprint("forum_bp", __name__)

# Predefined valid tags
VALID_TAGS = [
    "programming",
    "study_group",
    "homework_help",
    "exam_prep",
    "project_help",
    "general",
    "course_discussion",
    "career",
]


def sanitize_input(data: str) -> str:
    """Sanitize user input to prevent XSS"""
    return bleach.clean(data)

def validate_forum_access(
    forum_id: str, user_id: str, required_role: Optional[str] = None
) -> Tuple[Dict, Optional[str]]:
    """Validate forum access and permissions"""
    try:
        forum_model = Forum(current_app.db, current_app.supabase)
        forum = forum_model.find_by_id(forum_id)

        if not forum:
            return None, "Forum not found"

        if required_role:
            user_role = forum_model.get_member_role(forum_id, user_id)
            if not user_role or ForumRole[user_role.upper()].value != required_role:
                return None, "Insufficient permissions"

        return forum, None
    except Exception as e:
        current_app.logger.error(f"Error validating forum access: {str(e)}")
        return None, "Error validating forum access"


def validate_forum_data(data: Dict) -> Tuple[bool, Optional[str]]:
    """Validate forum creation/update data"""
    if not data.get("name"):
        return False, "Forum name is required"
    if not data.get("description"):
        return False, "Description is required"
    if not data.get("tags"):
        return False, "At least one tag is required"

    # Validate name length
    if len(data["name"]) < 3 or len(data["name"]) > 50:
        return False, "Forum name must be between 3 and 50 characters"

    # Validate description length
    if len(data["description"]) < 10 or len(data["description"]) > 500:
        return False, "Description must be between 10 and 500 characters"

    # Validate tags
    if not isinstance(data["tags"], list):
        return False, "Tags must be a list"
    if len(data["tags"]) > 5:
        return False, "Maximum 5 tags allowed"
    if not all(tag in VALID_TAGS for tag in data["tags"]):
        return False, f"Invalid tags. Valid tags are: {', '.join(VALID_TAGS)}"

    # Validate category
    if "category" in data:
        try:
            ForumCategory(data["category"])
        except ValueError:
            return (
                False,
                f"Invalid category. Valid categories are: {', '.join(c.value for c in ForumCategory)}",
            )

    # Validate visibility
    if "visibility" in data:
        try:
            ForumVisibility(data["visibility"])
        except ValueError:
            return (
                False,
                f"Invalid visibility. Valid options are: {', '.join(v.value for v in ForumVisibility)}",
            )

    return True, None


def _viewer_info(forum: Dict) -> Dict:
    """Membership/permissions of the signed-in user for a forum, if any."""
    viewer = {"is_member": False, "role": None, "is_owner": False, "can_edit": False, "is_pinned": False}
    try:
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
    except Exception:  # invalid/expired token: treat as signed out
        identity = None
    user = (
        current_app.db["users"].find_one({"supabase_id": str(identity)}, {"pinned_forums": 1})
        if identity else None
    )
    if not user:
        return viewer
    user_id = str(user["_id"])
    # forum["_id"] may already be a string here; compare as strings.
    viewer["is_pinned"] = str(forum.get("_id")) in {str(f) for f in user.get("pinned_forums") or []}
    member = next(
        (m for m in forum.get("members", []) if m.get("user_id") == user_id), None
    )
    role = member.get("role") if member else None
    viewer.update(
        is_member=member is not None,
        role=role,
        is_owner=str(forum.get("creator_id")) == user_id,
        can_edit=role == ForumRole.ADMIN.value,
    )
    return viewer


MAX_PINNED = 10
PIN_FORUM_FIELDS = {"name": 1, "slug": 1, "avatar_url": 1, "category": 1, "member_count": 1}


def _visible_forum(forum_id: str, user_id: str) -> Optional[Dict]:
    """Active forum the user may see (public, or private and a member)."""
    try:
        return current_app.db["forums"].find_one({
            "_id": ObjectId(forum_id),
            "status": ForumStatus.ACTIVE.value,
            "$or": [{"visibility": {"$ne": ForumVisibility.PRIVATE.value}}, {"members.user_id": user_id}],
        }, {"_id": 1})
    except InvalidId:
        return None


@forum_bp.route("/pinned", methods=["GET"])
@jwt_required()
def list_pinned_forums():
    """The user's pinned forums, most recently pinned first."""
    try:
        user = current_app.db["users"].find_one(
            {"supabase_id": get_jwt_identity()}, {"pinned_forums": 1}
        )
        if not user:
            return jsonify({"error": "User not found"}), 404
        pinned = user.get("pinned_forums") or []
        user_id = str(user["_id"])
        found = {
            f["_id"]: f for f in current_app.db["forums"].find(
                {
                    "_id": {"$in": pinned},
                    "status": ForumStatus.ACTIVE.value,
                    "$or": [{"visibility": {"$ne": ForumVisibility.PRIVATE.value}}, {"members.user_id": user_id}],
                },
                PIN_FORUM_FIELDS,
            )
        }
        forums = [found[i] for i in pinned if i in found]  # keep pin order
        for f in forums:
            f["_id"] = str(f["_id"])
        return jsonify({"forums": forums})
    except Exception as e:
        current_app.logger.error(f"Error listing pinned forums: {str(e)}")
        return jsonify({"error": "Error retrieving pinned channels"}), 500


@forum_bp.route("/<forum_id>/pin", methods=["PUT"])
@jwt_required()
def pin_forum(forum_id):
    """Pin a forum to the top of the user's list (max MAX_PINNED)."""
    try:
        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({"error": "User not found"}), 404
        if not _visible_forum(forum_id, user_id):
            return jsonify({"error": "Forum not found"}), 404
        users = current_app.db["users"]
        users.update_one({"_id": ObjectId(user_id)}, {"$pull": {"pinned_forums": ObjectId(forum_id)}})
        users.update_one(
            {"_id": ObjectId(user_id)},
            {"$push": {"pinned_forums": {"$each": [ObjectId(forum_id)], "$position": 0, "$slice": MAX_PINNED}}},
        )
        return jsonify({"success": True, "is_pinned": True})
    except Exception as e:
        current_app.logger.error(f"Error pinning forum: {str(e)}")
        return jsonify({"error": "Error pinning channel"}), 500


@forum_bp.route("/<forum_id>/pin", methods=["DELETE"])
@jwt_required()
def unpin_forum(forum_id):
    try:
        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({"error": "User not found"}), 404
        current_app.db["users"].update_one(
            {"_id": ObjectId(user_id)}, {"$pull": {"pinned_forums": ObjectId(forum_id)}}
        )
        return jsonify({"success": True, "is_pinned": False})
    except InvalidId:
        return jsonify({"error": "Forum not found"}), 404
    except Exception as e:
        current_app.logger.error(f"Error unpinning forum: {str(e)}")
        return jsonify({"error": "Error unpinning channel"}), 500


@forum_bp.route("/suggestions", methods=["GET"])
@jwt_required()
def suggested_forums():
    """Popular public forums the user hasn't joined."""
    try:
        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({"error": "User not found"}), 404
        limit = min(max(int(request.args.get("limit", 5)), 1), 20)
        forums = list(
            current_app.db["forums"].find(
                {
                    "status": ForumStatus.ACTIVE.value,
                    "visibility": {"$ne": ForumVisibility.PRIVATE.value},
                    "members.user_id": {"$ne": user_id},
                },
                PIN_FORUM_FIELDS,
            ).sort([("member_count", -1), ("last_active", -1)]).limit(limit)
        )
        for f in forums:
            f["_id"] = str(f["_id"])
        return jsonify({"forums": forums})
    except ValueError:
        return jsonify({"error": "Invalid limit"}), 400
    except Exception as e:
        current_app.logger.error(f"Error suggesting forums: {str(e)}")
        return jsonify({"error": "Error retrieving suggestions"}), 500


@forum_bp.route("/", methods=["GET"])
def list_forums():
    """Get list of forums with filtering and pagination"""
    try:
        page = int(request.args.get("page", 1))
        per_page = min(int(request.args.get("per_page", 10)), 50)
        category = request.args.get("category")
        tag = request.args.get("tag")
        search = request.args.get("search")
        sort_by = request.args.get("sort_by", "created_at")

        forum_model = Forum(current_app.db, current_app.supabase)

        # Build query
        query = {"status": ForumStatus.ACTIVE.value}
        if category:
            query["category"] = category
        if tag:
            query["tags"] = tag
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
            ]

        # Build sort
        sort_options = {
            "created_at": ("created_at", -1),
            "member_count": ("member_count", -1),
            "activity": ("last_active", -1),
        }
        sort = sort_options.get(sort_by, ("created_at", -1))

        # Execute query with pagination
        skip = (page - 1) * per_page
        total = forum_model.collection.count_documents(query)
        forums = list(
            forum_model.collection.find(query).sort(*sort).skip(skip).limit(per_page)
        )

        # Per-forum flags for the signed-in viewer (if any); the member list
        # itself is never returned.
        try:
            verify_jwt_in_request(optional=True)
            identity = get_jwt_identity()
        except Exception:  # invalid/expired token: treat as signed out
            identity = None
        viewer_id = get_user_id(identity) if identity else None
        for forum in forums:
            members = forum.pop("members", None) or []
            forum["is_member"] = bool(viewer_id) and any(m.get("user_id") == viewer_id for m in members)
            forum["is_owner"] = bool(viewer_id) and str(forum.get("creator_id")) == viewer_id
            forum["_id"] = str(forum["_id"])

        return jsonify(
            {
                "forums": forums,
                "total": total,
                "page": page,
                "per_page": per_page,
                "total_pages": (total + per_page - 1) // per_page,
            }
        )

    except Exception as e:
        current_app.logger.error(f"Error listing forums: {str(e)}")
        return jsonify({"error": "Error retrieving forums"}), 500


@forum_bp.route("/mine", methods=["GET"])
@jwt_required()
def list_my_forums():
    """Forums the signed-in user is a member of (for the sidebar)."""
    try:
        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({"error": "User not found"}), 404

        forum_model = Forum(current_app.db, current_app.supabase)
        forums = list(
            forum_model.collection.find(
                {"status": ForumStatus.ACTIVE.value, "members.user_id": user_id},
                {"name": 1, "slug": 1, "category": 1, "member_count": 1, "avatar_url": 1},
            ).sort("name", 1)
        )
        for forum in forums:
            forum["_id"] = str(forum["_id"])

        return jsonify({"forums": forums})

    except Exception as e:
        current_app.logger.error(f"Error listing user's forums: {str(e)}")
        return jsonify({"error": "Error retrieving your forums"}), 500


@forum_bp.route("/", methods=["POST"])
@jwt_required()
def create_forum():
    """Create a new forum with validation"""
    try:
        current_app.logger.debug("Starting forum creation route...")

        # Get user info
        user_token = get_jwt_identity()
        user_model = UserModel(current_app.db, current_app.supabase)
        user = user_model.get_user_by_supabase_id(user_token)

        if not user:
            return jsonify({"success": False, "errors": ["User not found"]}), 404

        user_id = str(user["_id"])
        current_app.logger.debug(f"User authenticated: {user_id}")

        # Get data
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "errors": ["No data provided"]}), 400

        current_app.logger.debug(f"Received data: {data}")

        # Clean data
        try:
            forum_data = {
                "name": bleach.clean(str(data.get("name", "")).strip()),
                "description": bleach.clean(str(data.get("description", "")).strip()),
                "category": str(data.get("category", "")).strip(),
                "tags": [
                    bleach.clean(str(tag)).strip().lower()
                    for tag in data.get("tags", [])
                    if tag
                ],
                "visibility": str(data.get("visibility", "public")).strip().lower(),
                "creator_id": user_id,
            }

            if "rules" in data and data["rules"] is not None:
                forum_data["rules"] = bleach.clean(str(data["rules"]))

            current_app.logger.debug(f"Cleaned data: {forum_data}")

        except Exception as e:
            current_app.logger.error(f"Data cleaning error: {str(e)}")
            return (
                jsonify(
                    {
                        "success": False,
                        "errors": [f"Error processing input data: {str(e)}"],
                    }
                ),
                400,
            )

        # Create forum
        current_app.logger.debug("Creating forum...")
        forum_model = Forum(current_app.db, current_app.supabase)
        forum_id, error = forum_model.create_forum(forum_data)

        if error:
            current_app.logger.error(f"Forum creation error: {error}")
            return jsonify({"success": False, "errors": [str(error)]}), 400

        # Get created forum
        current_app.logger.debug(f"Retrieving created forum: {forum_id}")
        created_forum = forum_model.find_by_id(forum_id)
        if not created_forum:
            return (
                jsonify(
                    {"success": False, "errors": ["Error retrieving created forum"]}
                ),
                500,
            )

        # Format response
        response_data = {
            "id": str(created_forum["_id"]),
            "name": created_forum["name"],
            "description": created_forum["description"],
            "category": created_forum["category"],
            "tags": created_forum["tags"],
            "visibility": created_forum.get("visibility", "public"),
            "creator_id": str(created_forum["creator_id"]),
            "created_at": created_forum["created_at"],
            "member_count": created_forum["member_count"],
            "rules": created_forum.get("rules", ""),
            "slug": created_forum.get("slug", ""),
        }

        current_app.logger.debug("Forum creation successful")
        return (
            jsonify(
                {
                    "success": True,
                    "message": "Forum created successfully",
                    "forum": response_data,
                }
            ),
            201,
        )

    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}\nTraceback: {traceback.format_exc()}"
        current_app.logger.error(f"Route error: {error_msg}")
        return jsonify({"success": False, "errors": [str(e)]}), 500


@forum_bp.route("/<forum_identifier>", methods=["GET"])
def get_forum(forum_identifier):
    """Get forum details by ID or slug"""
    try:
        forum_model = Forum(current_app.db, current_app.supabase)

        try:
            forum = forum_model.find_by_id(forum_identifier)
        except (InvalidId, Exception):
            forum = None

        if not forum:
            forum = forum_model.find_by_slug(forum_identifier)

        if not forum:
            return jsonify({"error": "Forum not found"}), 404

        # Increment view count without waiting for the write (w=0).
        forum_model.collection.with_options(
            write_concern=WriteConcern(w=0)
        ).update_one({"_id": forum["_id"]}, {"$inc": {"metadata.views": 1}})
        forum["_id"] = str(forum["_id"])

        # Tell the (optional) signed-in viewer how they relate to this forum,
        # and don't expose the member list publicly.
        forum["viewer"] = _viewer_info(forum)
        forum.pop("members", None)

        # Stats come from the document we already have (no second query).
        metadata = forum.get("metadata") or {}
        forum["stats"] = {
            "member_count": forum.get("member_count", 0),
            "post_count": forum.get("post_count", 0),
            "views": metadata.get("views", 0) + 1,
            "trending_score": metadata.get("trending_score", 0),
            "last_active": forum.get("last_active"),
            "creation_date": forum.get("created_at"),
        }

        return jsonify(forum)

    except Exception as e:
        current_app.logger.error(f"Error getting forum: {str(e)}")
        return jsonify({"error": "Error retrieving forum"}), 500



@forum_bp.route("/<forum_id>", methods=["PATCH"])
@jwt_required()
def update_forum(forum_id):  # pylint: disable=too-many-branches
    """Update forum details"""
    try:
        # Get user
        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({"success": False, "error": "User not found"}), 404

        # Validate forum access
        _forum, error = validate_forum_access(forum_id, user_id, ForumRole.ADMIN.value)
        if error:
            return jsonify({"success": False, "error": error}), 403

        # Get and validate request data
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400

        # Clean input data
        update_data = {}
        try:
            if "name" in data:
                update_data["name"] = bleach.clean(str(data["name"]).strip())
            if "description" in data:
                update_data["description"] = bleach.clean(
                    str(data["description"]).strip()
                )
            if "tags" in data:
                update_data["tags"] = [
                    bleach.clean(str(tag)).strip().lower()
                    for tag in data["tags"]
                    if tag and len(str(tag).strip()) > 0
                ]
            if "visibility" in data:
                update_data["visibility"] = str(data["visibility"]).strip().lower()
            if "rules" in data:
                update_data["rules"] = bleach.clean(str(data["rules"]))
            if "category" in data:
                update_data["category"] = str(data["category"]).strip()
            if "avatar_url" in data:
                update_data["avatar_url"] = bleach.clean(str(data["avatar_url"]))
            if "banner_url" in data:
                update_data["banner_url"] = bleach.clean(str(data["banner_url"]))
        except Exception as e:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": f"Error processing input data: {str(e)}",
                    }
                ),
                400,
            )

        # Update forum
        forum_model = Forum(current_app.db, current_app.supabase)
        success, error = forum_model.update_forum(forum_id, update_data, user_id)

        if not success:
            return jsonify({"success": False, "error": error}), 400

        # Get updated forum
        updated_forum = forum_model.find_by_id(forum_id)
        if not updated_forum:
            return (
                jsonify({"success": False, "error": "Error retrieving updated forum"}),
                500,
            )

        return jsonify(
            {
                "success": True,
                "message": "Forum updated successfully",
                "forum": {
                    "id": str(updated_forum["_id"]),
                    "name": updated_forum["name"],
                    "description": updated_forum["description"],
                    "tags": updated_forum["tags"],
                    "visibility": updated_forum.get("visibility", "public"),
                    "rules": updated_forum.get("rules", ""),
                    "category": updated_forum.get("category", ""),
                    "slug": updated_forum.get("slug", ""),
                    "updated_at": updated_forum["updated_at"],
                },
            }
        )

    except Exception as e:
        current_app.logger.error(f"Error updating forum: {str(e)}")
        return (
            jsonify({"success": False, "error": f"Error updating forum: {str(e)}"}),
            500,
        )


# --- Channel images (Supabase Storage) ---------------------------------------

# kind -> (forum field, max bytes)
CHANNEL_IMAGE_KINDS = {
    "avatar": ("avatar_url", 2 * 1024 * 1024),
    "banner": ("banner_url", 5 * 1024 * 1024),
}


@forum_bp.route("/<forum_id>/images/<kind>", methods=["POST"])
@jwt_required()
def upload_forum_image(forum_id, kind):
    """Upload a channel icon ("avatar") or banner. Channel admins only."""
    try:
        if kind not in CHANNEL_IMAGE_KINDS:
            return jsonify({"success": False, "error": "Unknown image type"}), 404
        field, max_bytes = CHANNEL_IMAGE_KINDS[kind]

        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({"success": False, "error": "User not found"}), 404
        forum, error = validate_forum_access(forum_id, user_id, ForumRole.ADMIN.value)
        if error:
            status = 404 if error == "Forum not found" else 403
            return jsonify({"success": False, "error": error}), status

        image, error = read_image_upload(request.files.get("file"), max_bytes)
        if error:
            return jsonify({"success": False, "error": error}), 400
        image_url = upload_image(CHANNEL_IMAGE_BUCKET, str(forum["_id"]), kind, image)

        Forum(current_app.db, current_app.supabase).collection.update_one(
            {"_id": forum["_id"]},
            {"$set": {field: image_url, "updated_at": datetime.utcnow()}},
        )
        remove_images(CHANNEL_IMAGE_BUCKET, [forum.get(field)])

        return jsonify({"success": True, field: image_url})

    except Exception as e:
        current_app.logger.error(f"Error uploading channel image: {str(e)}")
        return jsonify({"success": False, "error": "Error uploading image"}), 500


@forum_bp.route("/<forum_id>/images/<kind>", methods=["DELETE"])
@jwt_required()
def delete_forum_image(forum_id, kind):
    """Remove a channel icon or banner (back to the default). Admins only."""
    try:
        if kind not in CHANNEL_IMAGE_KINDS:
            return jsonify({"success": False, "error": "Unknown image type"}), 404
        field = CHANNEL_IMAGE_KINDS[kind][0]

        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({"success": False, "error": "User not found"}), 404
        forum, error = validate_forum_access(forum_id, user_id, ForumRole.ADMIN.value)
        if error:
            status = 404 if error == "Forum not found" else 403
            return jsonify({"success": False, "error": error}), status

        Forum(current_app.db, current_app.supabase).collection.update_one(
            {"_id": forum["_id"]},
            {"$unset": {field: ""}, "$set": {"updated_at": datetime.utcnow()}},
        )
        remove_images(CHANNEL_IMAGE_BUCKET, [forum.get(field)])
        return jsonify({"success": True, field: None})

    except Exception as e:
        current_app.logger.error(f"Error removing channel image: {str(e)}")
        return jsonify({"success": False, "error": "Error removing image"}), 500


@forum_bp.route("/<forum_id>/members", methods=["POST"])
@jwt_required()
def manage_membership(forum_id):
    """Join or leave forum"""
    try:
        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({"error": "User not found"}), 404

        action = request.json.get("action")
        if action not in ["join", "leave"]:
            return jsonify({"error": "Invalid action"}), 400

        forum_model = Forum(current_app.db, current_app.supabase)
        forum = forum_model.find_by_id(forum_id)

        if not forum:
            return jsonify({"error": "Forum not found"}), 404

        if action == "join":
            success, error = forum_model.add_member(forum_id, user_id)
        elif str(forum.get("creator_id")) == user_id:
            return jsonify({"error": "The channel owner can't leave their own channel"}), 400
        else:
            success, error = forum_model.remove_member(forum_id, user_id)

        if not success:
            return jsonify({"error": error}), 400

        verb = "joined" if action == "join" else "left"
        return jsonify({"message": f"Successfully {verb} forum"})

    except Exception as e:
        current_app.logger.error(f"Error managing membership: {str(e)}")
        return jsonify({"error": "Error managing forum membership"}), 500


@forum_bp.route("/<forum_id>/members/<member_id>/role", methods=["PATCH"])
@jwt_required()
def update_member_role(forum_id, member_id):
    """Update member role (admin only)"""
    try:
        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({"error": "User not found"}), 404

        _forum, error = validate_forum_access(forum_id, user_id, ForumRole.ADMIN.value)
        if error:
            return jsonify({"error": error}), 403

        new_role = request.json.get("role")
        if not new_role or new_role not in [role.value for role in ForumRole]:
            return jsonify({"error": "Invalid role"}), 400

        forum_model = Forum(current_app.db, current_app.supabase)
        success, error = forum_model.update_member_role(forum_id, member_id, new_role)

        if not success:
            return jsonify({"error": error}), 400

        return jsonify({"message": "Member role updated successfully"})

    except Exception as e:
        current_app.logger.error(f"Error updating member role: {str(e)}")
        return jsonify({"error": "Error updating member role"}), 500


@forum_bp.route("/<forum_id>", methods=["DELETE"])
@jwt_required()
def delete_forum(forum_id):
    """Delete a forum (admin only)"""
    try:
        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({"error": "User not found"}), 404

        # Validate user role and forum access
        _forum, error = validate_forum_access(forum_id, user_id, ForumRole.ADMIN.value)
        if error:
            return jsonify({"error": error}), 403

        # Delete the forum
        forum_model = Forum(current_app.db, current_app.supabase)
        success = forum_model.delete_forum(forum_id)
        error = None if success else "Failed to delete forum"

        if not success:
            return jsonify({"error": error}), 400

        return jsonify({"message": "Forum deleted successfully", "success": True}), 200

    except Exception as e:
        current_app.logger.error(f"Error deleting forum: {str(e)}")
        return jsonify({"error": "Error deleting forum"}), 500


# Error handlers
@forum_bp.errorhandler(400)
def handle_bad_request(e):
    return jsonify({"error": "Bad Request", "message": str(e)}), 400


@forum_bp.errorhandler(401)
def handle_unauthorized(_e):
    return jsonify({"error": "Unauthorized", "message": "Authentication required"}), 401


@forum_bp.errorhandler(403)
def handle_forbidden(_e):
    return jsonify({"error": "Forbidden", "message": "Insufficient permissions"}), 403


@forum_bp.errorhandler(404)
def handle_not_found(e):
    return jsonify({"error": "Not Found", "message": str(e)}), 404


@forum_bp.errorhandler(500)
def handle_server_error(e):
    current_app.logger.error(f"Server error: {str(e)}")
    return (
        jsonify(
            {
                "error": "Internal Server Error",
                "message": "An unexpected error occurred",
            }
        ),
        500,
    )
