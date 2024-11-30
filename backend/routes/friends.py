from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.friend_request import FriendRequest
from models.user import UserModel
from utils.helpers import get_user_id

friends_bp = Blueprint('friends_bp', __name__)

@friends_bp.route("/friends", methods=["GET"])
@jwt_required()
def get_friends():
    """Get the list of friends for the current user"""
    try:
        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({"error": "User not found"}), 404

        friend_request = FriendRequest(current_app.db, current_app.supabase)
        friends = friend_request.get_friends(user_id)

        # Get user details for each friend
        user_model = UserModel(current_app.db, current_app.supabase)
        formatted_friends = []
        for friend_id in friends:
            friend = user_model.find_by_id(str(friend_id))
            if friend:
                formatted_friends.append({
                    "_id": str(friend["_id"]),
                    "username": friend.get("username"),
                    "profile": friend.get("profile")
                })

        return jsonify({"friends": formatted_friends})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@friends_bp.route("/friends/unfriend", methods=["POST"])
@jwt_required()
def unfriend_user():
    """Unfriend a user"""
    try:
        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({"error": "User not found"}), 404

        data = request.get_json()
        friend_id = data.get("user_id")
        if not friend_id:
            return jsonify({"error": "User ID is required"}), 400

        friend_request = FriendRequest(current_app.db, current_app.supabase)
        success, error = friend_request.unfriend(user_id, friend_id)

        if error:
            return jsonify({"error": error}), 400

        return jsonify({"message": "Successfully unfriended user"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500