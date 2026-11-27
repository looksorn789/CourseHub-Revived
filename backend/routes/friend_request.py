from bson.errors import InvalidId
from bson import ObjectId
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.friend_request import FriendRequest, RequestStatus
from models.user import UserModel
from utils.helpers import get_user_id

friend_request_bp = Blueprint('friend_request_bp', __name__)

@friend_request_bp.route("/send", methods=["POST"])
@jwt_required()
def send_request():
    """Send a friend request"""
    try:
        sender_id = get_user_id(get_jwt_identity())
        if not sender_id:
            return jsonify({"error": "User not found"}), 404

        data = request.get_json()
        receiver_id = data.get("receiver_id")
        if not receiver_id:
            return jsonify({"error": "Receiver ID is required"}), 400

        friend_request = FriendRequest(current_app.db, current_app.supabase)
        _, error, request_id = friend_request.create_request(sender_id, receiver_id)

        if error:
            return jsonify({"error": error}), 400

        return jsonify({
            "message": "Friend request sent successfully",
            "request_id": request_id
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@friend_request_bp.route("/pending", methods=["GET"])
@jwt_required()
def get_pending_requests():
    """Get pending friend requests"""
    try:
        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({"error": "User not found"}), 404

        friend_request = FriendRequest(current_app.db, current_app.supabase)
        requests = friend_request.get_pending_requests(user_id)

        # Get user details for each request
        user_model = UserModel(current_app.db, current_app.supabase)
        formatted_requests = []
        for req in requests:
            sender = user_model.find_by_id(str(req["sender_id"]))
            if sender:
                formatted_requests.append({
                    "request_id": str(req["_id"]),
                    "sender": {
                        "id": str(sender["_id"]),
                        "username": sender.get("username"),
                        "profile": sender.get("profile")
                    },
                    "created_at": req["created_at"]
                })

        return jsonify({"requests": formatted_requests})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@friend_request_bp.route("/pending/count", methods=["GET"])
@jwt_required()
def count_pending_requests():
    """Number of requests waiting for an answer (for the Friends badge)."""
    try:
        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({"error": "User not found"}), 404
        count = FriendRequest(current_app.db, current_app.supabase).count_pending_requests(user_id)
        return jsonify({"count": count})
    except Exception as e:
        current_app.logger.error(f"Error counting friend requests: {str(e)}")
        return jsonify({"error": "Error counting friend requests"}), 500


@friend_request_bp.route("/respond", methods=["POST"])
@jwt_required()
def respond_to_request():
    """Respond to a friend request"""
    try:
        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({"error": "User not found"}), 404

        data = request.get_json()
        request_id = data.get("request_id")
        accept = data.get("accept")

        if request_id is None or accept is None:
            return jsonify({"error": "Request ID and response are required"}), 400

        friend_request = FriendRequest(current_app.db, current_app.supabase)
        _, error = friend_request.respond_to_request(request_id, accept, user_id)

        if error:
            return jsonify({"error": error}), 400

        return jsonify({
            "message": "Friend request accepted" if accept else "Friend request declined"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@friend_request_bp.route("/sent", methods=["GET"])
@jwt_required()
def get_sent_requests():
    """Get sent friend requests"""
    try:
        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({"error": "User not found"}), 404

        friend_request = FriendRequest(current_app.db, current_app.supabase)
        requests = friend_request.get_sent_requests(user_id)

        # Get user details for each request
        user_model = UserModel(current_app.db, current_app.supabase)
        formatted_requests = []
        for req in requests:
            receiver = user_model.find_by_id(str(req["receiver_id"]))
            if receiver:
                formatted_requests.append({
                    "request_id": str(req["_id"]),
                    "receiver": {
                        "id": str(receiver["_id"]),
                        "username": receiver.get("username"),
                        "profile": receiver.get("profile")
                    },
                    "created_at": req["created_at"]
                })

        return jsonify({"requests": formatted_requests})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@friend_request_bp.route("/cancel", methods=["POST"])
@jwt_required()
def cancel_request():
    """Cancel a sent friend request"""
    try:
        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({"error": "User not found"}), 404

        data = request.get_json()
        request_id = data.get("request_id")
        if not request_id:
            return jsonify({"error": "Request ID is required"}), 400

        friend_request = FriendRequest(current_app.db, current_app.supabase)
        _, error = friend_request.cancel_request(request_id, user_id)

        if error:
            return jsonify({"error": error}), 400

        return jsonify({"message": "Friend request cancelled successfully"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@friend_request_bp.route("/status/<user_id>", methods=["GET"])
@jwt_required()
def friendship_status(user_id):
    """Your relationship with another user, for profile buttons:
    self | friends | sent | received | none, plus their friend count."""
    try:
        me = get_user_id(get_jwt_identity())
        if not me:
            return jsonify({"error": "User not found"}), 404
        try:
            other = ObjectId(user_id)
        except InvalidId:
            return jsonify({"error": "User not found"}), 404
        me_oid = ObjectId(me)

        status, request_id = ("self", None) if other == me_oid else ("none", None)
        friend_count = 0
        # One query: every accepted/pending request involving that user.
        for req in current_app.db["friend_requests"].find(
            {
                "$or": [{"sender_id": other}, {"receiver_id": other}],
                "status": {"$in": [RequestStatus.ACCEPTED.value, RequestStatus.PENDING.value]},
            },
            {"sender_id": 1, "receiver_id": 1, "status": 1},
        ):
            if req["status"] == RequestStatus.ACCEPTED.value:
                friend_count += 1
            if status == "self" or me_oid not in (req["sender_id"], req["receiver_id"]):
                continue
            if req["status"] == RequestStatus.ACCEPTED.value:
                status, request_id = "friends", str(req["_id"])
            elif status != "friends":
                status = "sent" if req["sender_id"] == me_oid else "received"
                request_id = str(req["_id"])

        return jsonify({"status": status, "request_id": request_id, "friend_count": friend_count})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
