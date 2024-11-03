from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from pymongo.errors import PyMongoError
from models.forum import Forum, ForumRole, ForumStatus, ForumVisibility, ForumCategory
from models.user import UserModel
from typing import Optional, Dict, Tuple
import bleach
from bson import ObjectId

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


def get_user_id(user_token: str) -> Optional[str]:
    """Helper to get user ID from token"""
    try:
        user_model = UserModel(current_app.db, current_app.supabase)
        user = user_model.get_user_by_supabase_id(user_token)
        return str(user["_id"]) if user else None
    except Exception as e:
        current_app.logger.error(f"Error getting user ID: {str(e)}")
        return None


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

        # Clean response data
        for forum in forums:
            forum["_id"] = str(forum["_id"])
            forum.pop("members", None)

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
        import traceback

        error_msg = f"Unexpected error: {str(e)}\nTraceback: {traceback.format_exc()}"
        current_app.logger.error(f"Route error: {error_msg}")
        return jsonify({"success": False, "errors": [str(e)]}), 500


@forum_bp.route("/<forum_id>", methods=["GET"])
def get_forum(forum_id):
    """Get forum details"""
    try:
        forum_model = Forum(current_app.db, current_app.supabase)
        forum = forum_model.find_by_id(forum_id)

        if not forum:
            return jsonify({"error": "Forum not found"}), 404

        # Increment view count
        forum_model.collection.update_one(
            {"_id": ObjectId(forum_id)}, {"$inc": {"metadata.views": 1}}
        )

        # Clean response data
        forum["_id"] = str(forum["_id"])

        # Include member count and stats
        stats = forum_model.get_forum_stats(forum_id)
        if stats:
            forum["stats"] = stats

        return jsonify(forum)

    except Exception as e:
        current_app.logger.error(f"Error getting forum: {str(e)}")
        return jsonify({"error": "Error retrieving forum"}), 500


@forum_bp.route("/<forum_id>", methods=["PATCH"])
@jwt_required()
def update_forum(forum_id):
    """Update forum details"""
    try:
        # Get user
        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({"success": False, "error": "User not found"}), 404

        # Validate forum access
        forum, error = validate_forum_access(forum_id, user_id, ForumRole.ADMIN.value)
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
        else:
            success, error = forum_model.remove_member(forum_id, user_id)

        if not success:
            return jsonify({"error": error}), 400

        return jsonify({"message": f"Successfully {action}ed forum"})

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

        forum, error = validate_forum_access(forum_id, user_id, ForumRole.ADMIN.value)
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
        forum, error = validate_forum_access(forum_id, user_id, ForumRole.ADMIN.value)
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
def handle_unauthorized(e):
    return jsonify({"error": "Unauthorized", "message": "Authentication required"}), 401


@forum_bp.errorhandler(403)
def handle_forbidden(e):
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
