from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.reply import Reply
from models.comment import Comment
from models.user import UserModel
import bleach
from typing import Optional

reply_bp = Blueprint('reply_bp', __name__)

def get_user_id(supabase_user_id: str) -> Optional[str]:
    """Get MongoDB user ID from Supabase ID"""
    try:
        user_model = UserModel(current_app.db, current_app.supabase)
        user = user_model.get_user_by_supabase_id(supabase_user_id)
        return str(user["_id"]) if user else None
    except Exception as e:
        current_app.logger.error(f"Error getting user ID: {str(e)}")
        return None

@reply_bp.route('/comments/<comment_id>/replies', methods=['POST'])
@jwt_required()
def create_reply(comment_id):
    """Create a new reply to a comment"""
    try:
        # Get user
        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({"success": False, "error": "User not found"}), 404

        # Validate parent comment exists
        comment_model = Comment(current_app.db, current_app.supabase)
        comment = comment_model.find_by_id(comment_id)
        if not comment:
            return jsonify({"success": False, "error": "Parent comment not found"}), 404

        # Get and validate request data
        data = request.get_json()
        if not data:
            return jsonify({
                "success": False,
                "error": "No data provided",
                "details": "Request body is empty"
            }), 400

        # Clean and prepare reply data
        reply_data = {
            "comment_id": comment_id,
            "user_id": user_id,
            "content": bleach.clean(
                str(data.get("content", "")).strip(),
                tags=["p", "br", "strong", "em", "code"],
                strip=True
            )
        }

        # Create reply
        reply_model = Reply(current_app.db, current_app.supabase)
        reply_id, error = reply_model.create_reply(reply_data)

        if error:
            return jsonify({
                "success": False,
                "error": "Failed to create reply",
                "details": error
            }), 400

        # Get created reply
        created_reply = reply_model.find_by_id(reply_id)
        if not created_reply:
            return jsonify({
                "success": False,
                "error": "Error retrieving created reply"
            }), 500

        # Format response
        response_data = {
            "id": str(created_reply["_id"]),
            "comment_id": str(created_reply["comment_id"]),
            "user_id": str(created_reply["user_id"]),
            "content": created_reply["content"],
            "created_at": created_reply["created_at"],
            "updated_at": created_reply["updated_at"]
        }

        return jsonify({
            "success": True,
            "message": "Reply created successfully",
            "data": response_data
        }), 201

    except Exception as e:
        current_app.logger.error(f"Error creating reply: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Error creating reply",
            "details": str(e)
        }), 500

@reply_bp.route('/replies/<reply_id>', methods=['PATCH'])
@jwt_required()
def update_reply(reply_id):
    """Update a reply"""
    try:
        # Get user
        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({"success": False, "error": "User not found"}), 404

        # Get reply
        reply_model = Reply(current_app.db, current_app.supabase)
        reply = reply_model.find_by_id(reply_id)

        if not reply:
            return jsonify({"success": False, "error": "Reply not found"}), 404

        # Check ownership
        if str(reply["user_id"]) != user_id:
            return jsonify({
                "success": False,
                "error": "Unauthorized to update this reply"
            }), 403

        # Get and validate request data
        data = request.get_json()
        if not data:
            return jsonify({
                "success": False,
                "error": "No data provided",
                "details": "Request body is empty"
            }), 400

        # Clean input data
        update_data = {
            "content": bleach.clean(
                str(data["content"]).strip(),
                tags=["p", "br", "strong", "em", "code"],
                strip=True
            )
        }

        # Update reply
        success, error = reply_model.update_reply(reply_id, update_data)

        if not success:
            return jsonify({
                "success": False,
                "error": "Failed to update reply",
                "details": error
            }), 400

        # Get updated reply
        updated_reply = reply_model.find_by_id(reply_id)
        if not updated_reply:
            return jsonify({
                "success": False,
                "error": "Error retrieving updated reply"
            }), 500

        return jsonify({
            "success": True,
            "message": "Reply updated successfully",
            "data": {
                "id": str(updated_reply["_id"]),
                "content": updated_reply["content"],
                "updated_at": updated_reply["updated_at"]
            }
        })

    except Exception as e:
        current_app.logger.error(f"Error updating reply: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Error updating reply",
            "details": str(e)
        }), 500

@reply_bp.route('/comments/<comment_id>/replies', methods=['GET'])
def get_replies(comment_id):
    """Get replies for a comment"""
    try:
        page = int(request.args.get("page", 1))
        per_page = min(int(request.args.get("per_page", 20)), 50)

        reply_model = Reply(current_app.db, current_app.supabase)
        replies, total = reply_model.get_replies_by_comment(
            comment_id,
            page=page,
            per_page=per_page
        )

        return jsonify({
            "success": True,
            "data": {
                "replies": replies,
                "total": total,
                "page": page,
                "per_page": per_page,
                "total_pages": (total + per_page - 1) // per_page
            }
        })

    except ValueError as e:
        return jsonify({
            "success": False,
            "error": "Invalid pagination parameters",
            "details": str(e)
        }), 400
    except Exception as e:
        current_app.logger.error(f"Error getting replies: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Error retrieving replies",
            "details": str(e)
        }), 500

@reply_bp.route('/replies/<reply_id>', methods=['DELETE'])
@jwt_required()
def delete_reply(reply_id):
    """Delete a reply"""
    try:
        # Get user
        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({"success": False, "error": "User not found"}), 404

        # Get reply
        reply_model = Reply(current_app.db, current_app.supabase)
        reply = reply_model.find_by_id(reply_id)

        if not reply:
            return jsonify({"success": False, "error": "Reply not found"}), 404

        # Check ownership
        if str(reply["user_id"]) != user_id:
            return jsonify({
                "success": False,
                "error": "Unauthorized to delete this reply"
            }), 403

        # Delete reply
        success, error = reply_model.delete_reply(reply_id)

        if not success:
            return jsonify({
                "success": False,
                "error": "Failed to delete reply",
                "details": error
            }), 400

        return jsonify({
            "success": True,
            "message": "Reply deleted successfully",
            "data": {"reply_id": reply_id}
        })

    except Exception as e:
        current_app.logger.error(f"Error deleting reply: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Error deleting reply",
            "details": str(e)
        }), 500

# Error handlers
@reply_bp.errorhandler(400)
def handle_bad_request(e):
    return jsonify({"error": "Bad Request", "message": str(e)}), 400

@reply_bp.errorhandler(401)
def handle_unauthorized(e):
    return jsonify({"error": "Unauthorized", "message": "Authentication required"}), 401

@reply_bp.errorhandler(403)
def handle_forbidden(e):
    return jsonify({"error": "Forbidden", "message": "Insufficient permissions"}), 403

@reply_bp.errorhandler(404)
def handle_not_found(e):
    return jsonify({"error": "Not Found", "message": str(e)}), 404

@reply_bp.errorhandler(500)
def handle_server_error(e):
    current_app.logger.error(f"Server error: {str(e)}")
    return jsonify({
        "error": "Internal Server Error",
        "message": "An unexpected error occurred"
    }), 500