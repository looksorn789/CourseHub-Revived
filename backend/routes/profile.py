from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import UserModel

profile_bp = Blueprint('profile_bp', __name__)


def handle_error(e: Exception, message: str = "An error occurred"):
    """Centralized error handling"""
    current_app.logger.error(f"{message}: {str(e)}")
    return jsonify({"error": message, "details": str(e)}), 500


@profile_bp.route("/", methods=["POST"])
@jwt_required()
def create_profile():
    """Create initial user profile"""
    try:
        user_id = get_jwt_identity()
        profile_data = request.get_json()

        if not profile_data:
            return (
                jsonify(
                    {"error": "No data provided", "details": "Request body is empty"}
                ),
                400,
            )

        user_model = UserModel(current_app.db, current_app.supabase)

        # Check existing profile
        existing_user = user_model.get_user_by_supabase_id(user_id)
        if existing_user and existing_user.get("profile_completed"):
            return (
                jsonify(
                    {
                        "message": "Profile already exists",
                        "profile_completed": True,
                        "user": existing_user,
                    }
                ),
                200,
            )

        # Create profile
        success, error = user_model.create_initial_profile(user_id, profile_data)

        if error:
            return (
                jsonify({"error": "Failed to create profile", "details": str(error)}),
                400,
            )

        return (
            jsonify(
                {
                    "message": "Profile created successfully",
                    "success": True,
                    "data": success,
                }
            ),
            201,
        )

    except Exception as e:
        return handle_error(e, "Error creating profile")


@profile_bp.route("/user", methods=["GET"])
@jwt_required()
def get_user_profile():
    """Get user profile"""
    try:
        user_id = get_jwt_identity()
        user_model = UserModel(current_app.db, current_app.supabase)
        user_data = user_model.get_user_by_supabase_id(user_id)

        if not user_data:
            return (
                jsonify(
                    {
                        "error": "User not found",
                        "details": "No user found with the provided ID",
                    }
                ),
                404,
            )

        response_data = {
            "_id": str(user_data["_id"]),
            "email": user_data.get("email"),
            "username": user_data.get("username"),
            "profile": user_data.get("profile", {}),
            "profileCompleted": user_data.get("profile_completed", False),
        }

        return jsonify(response_data), 200

    except Exception as e:
        return handle_error(e, "Error retrieving user profile")
    
@profile_bp.route("/user/<user_id>", methods=["GET"])
@jwt_required()
def get_user_by_id(user_id):
    """Get user profile by ID"""
    try:
        user_model = UserModel(current_app.db, current_app.supabase)
        user_data = user_model.find_by_id(user_id)

        if not user_data:
            return jsonify({
                "error": "User not found",
                "details": "No user found with the provided ID"
            }), 404

        response_data = {
            "_id": str(user_data["_id"]),
            "email": user_data.get("email"),
            "username": user_data.get("username"),
            "profile": {
                "first_name": user_data.get("profile", {}).get("first_name", ""),
                "last_name": user_data.get("profile", {}).get("last_name", ""),
                "bio": user_data.get("profile", {}).get("bio", ""),
                "school": user_data.get("profile", {}).get("school", ""),
                "major": user_data.get("profile", {}).get("major", ""),
                "graduation_date": user_data.get("profile", {}).get("graduation_date"),
                "avatar_config": user_data.get("profile", {}).get("avatar_config", {
                    "style": "adventurer",
                    "seed": user_data.get("username", "anonymous"),
                    "options": {}
                }),
                "interests": user_data.get("profile", {}).get("interests", []),
                "awards": user_data.get("profile", {}).get("awards", []),
                "clubs": user_data.get("profile", {}).get("clubs", []),
                "certifications": user_data.get("profile", {}).get("certifications", []),
            }
        }

        return jsonify(response_data), 200

    except Exception as e:
        return handle_error(e, "Error retrieving user profile")


@profile_bp.route("/user", methods=["PUT", "PATCH"])
@jwt_required()
def update_user_profile():
    """Update user profile"""
    try:
        user_id = get_jwt_identity()
        user_model = UserModel(current_app.db, current_app.supabase)
        request_data = request.get_json()

        if not request_data:
            return (
                jsonify(
                    {"error": "Invalid request", "details": "Request body is empty"}
                ),
                400,
            )

        profile_data = request_data.get("profile", {})
        if not profile_data and any(
            key in request_data for key in UserModel.PROFILE_FIELDS
        ):
            profile_data = request_data

        email = request_data.get("email")
        username = request_data.get("username")

        if not any([profile_data, email, username]):
            return (
                jsonify(
                    {
                        "error": "No update data provided",
                        "details": "No valid fields found in request",
                    }
                ),
                400,
            )

        # Update profile
        updated_data, error = user_model.update_user_profile(
            user_id, profile_data, email, username
        )

        if error:
            return jsonify({"error": "Validation failed", "details": error}), 400

        return (
            jsonify({"message": "Profile updated successfully", "data": updated_data}),
            200,
        )

    except Exception as e:
        return handle_error(e, "Error updating user profile")


# Error handlers
@profile_bp.errorhandler(400)
def handle_bad_request(e):
    return jsonify({"error": "Bad Request", "details": str(e)}), 400


@profile_bp.errorhandler(401)
def handle_unauthorized(e):
    return jsonify({"error": "Unauthorized", "details": f"Authentication required, details: {str(e)}"}), 401


@profile_bp.errorhandler(404)
def handle_not_found(e):
    return jsonify({"error": "Not Found", "details": str(e)}), 404


@profile_bp.errorhandler(500)
def handle_server_error(e):
    current_app.logger.error(f"Server error: {str(e)}")
    return (
        jsonify(
            {
                "error": "Internal Server Error",
                "details": "An unexpected error occurred",
            }
        ),
        500,
    )
