from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import UserModel

profile_bp = Blueprint("profile_bp", __name__)


@profile_bp.route("/profile", methods=["POST"])
@jwt_required()
def create_profile():
    try:
        # Get the authenticated user's ID
        user_id = get_jwt_identity()

        # Get and validate the request data
        profile_data = request.get_json()
        if not profile_data:
            return jsonify({"error": "No data provided"}), 400

        # Validate required fields
        required_fields = ["firstName", "lastName", "school", "major"]
        missing_fields = [
            field for field in required_fields if not profile_data.get(field)
        ]

        if missing_fields:
            return (
                jsonify(
                    {"error": f'Missing required fields: {", ".join(missing_fields)}'}
                ),
                400,
            )

        user_model = UserModel(current_app.db, current_app.supabase)

        # Check if the profile already exists
        existing_user = user_model.get_user_by_supabase_id(user_id)
        if existing_user and existing_user.get("profile_completed"):
            # If the profile already exists, return a success message to navigate to dashboard
            return jsonify({"message": "Profile already exists", "profile_completed": True}), 200

        # Create the initial profile for the user
        success, error = user_model.create_initial_profile(user_id, profile_data)

        if error:
            return jsonify({"error": str(error)}), 500

        if success:
            # Set profile_completed to True after successful profile creation
            user_model.collection.update_one(
                {"supabase_id": user_id}, {"$set": {"profile_completed": True}}
            )

        return (
            jsonify({"message": "Profile created successfully", "success": True}),
            201,
        )

    except Exception as e:
        print(f"Error creating profile: {str(e)}")
        return jsonify({"error": "Failed to create profile", "message": str(e)}), 500
    

@profile_bp.route("/user", methods=["GET"])
@jwt_required()
def get_user_profile():
    try:
        user_id = get_jwt_identity()
        user_model = UserModel(current_app.db, current_app.supabase)
        user_data = user_model.get_user_by_supabase_id(user_id)

        if not user_data:
            return jsonify({"error": "User not found"}), 404

        # Convert MongoDB ObjectId to string if present
        if "_id" in user_data:
            user_data["_id"] = str(user_data["_id"])

        # Structure response to include email and profile information
        response_data = {
            "email": user_data.get("email"),
            "username": user_data.get("username"),
            "profile": user_data.get("profile", {})
        }

        return jsonify(response_data), 200

    except Exception as e:
        current_app.logger.error(f"Error retrieving user profile: {str(e)}")
        return jsonify({"error": "Failed to retrieve profile", "message": str(e)}), 500


@profile_bp.route("/user", methods=["PUT"])
@jwt_required()
def update_user_profile():
    try:
        user_id = get_jwt_identity()
        user_model = UserModel(current_app.db, current_app.supabase)

        # Get the profile data, email, and username from the request
        profile_data = request.json.get("profile", {})
        email = request.json.get("email", None)
        username = request.json.get("username", None)

        if not profile_data and not email and not username:
            return jsonify({"error": "No profile, email, or username data provided"}), 400

        # Update the user profile in the database
        success, error = user_model.update_user_profile(user_id, profile_data, email, username)
        
        if error:
            return jsonify({"error": error}), 500

        return jsonify({"success": True}), 200

    except Exception as e:
        current_app.logger.error(f"Error updating user profile: {str(e)}")
        return jsonify({"error": "Failed to update profile", "message": str(e)}), 500


@profile_bp.route("/user", methods=["PATCH"])
@jwt_required()
def edit_user_profile():
    try:
        user_id = get_jwt_identity()
        user_model = UserModel(current_app.db, current_app.supabase)

        # Get the data from the request
        profile_data = request.json.get("profile", {})
        
        if not profile_data:
            return jsonify({"error": "No profile data provided"}), 400

        # Update the user profile in the database
        success, error = user_model.update_user_profile(user_id, profile_data)
        
        if error:
            return jsonify({"error": error}), 500

        return jsonify({"success": True}), 200

    except Exception as e:
        current_app.logger.error(f"Error updating user profile: {str(e)}")
        return jsonify({"error": "Failed to update profile", "message": str(e)}), 500
