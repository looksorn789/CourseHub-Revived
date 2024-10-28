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

        error = user_model.create_initial_profile(user_id, profile_data)

        if error:
            return jsonify({"error": str(error)}), (
                400 if "exists" in str(error) else 500
            )

        return (
            jsonify({"message": "Profile created successfully", "success": True}),
            201,
        )

    except Exception as e:
        print(f"Error creating profile: {str(e)}")
        return jsonify({"error": "Failed to create profile", "message": str(e)}), 500
