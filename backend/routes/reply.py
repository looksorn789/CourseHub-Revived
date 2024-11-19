from flask import Blueprint, request, jsonify, current_app
from typing import Optional
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import UserModel
from models.reply import Reply
from utils.helpers import serialize_mongo_doc
import bleach

reply_bp = Blueprint("reply_bp", __name__)

def get_user_id(supabase_user_id: str) -> Optional[str]:
    """Get MongoDB user ID from Supabase ID"""
    try:
        user_model = UserModel(current_app.db, current_app.supabase)
        user = user_model.get_user_by_supabase_id(supabase_user_id)
        if user and "_id" in user:
            return str(user["_id"])
        return None
    except Exception as e:
        current_app.logger.error(f"Error getting user ID: {str(e)}")
        return None
    
@reply_bp.route("/comment/<comment_id>", methods=["POST"])
@jwt_required()
def create_reply(comment_id):
    """Create reply"""
    try:
        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({"success": False, "error": "User not found"}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({
                "success": False,
                "error": "No data provided",
                "details": "Request body is empty"
            }), 400
        
        reply_data = {
            "comment_id": comment_id,
            "user_id": user_id,
            "content": bleach.clean(
                str(data.get("content", "")).strip(),
                tags=["p", "br", "strong", "em", "u", "code", "pre", "blockquote"],
                strip=True
            )
        }

        reply_model = Reply(current_app.db, current_app.supabase)
        reply_id, error = reply_model.create_reply(reply_data)

        if error:
            return jsonify({
                "success": False,
                "error": "Failed to create a reply",
                "details": error
            }), 400
        
        created_reply = reply_model.find_by_id(reply_id)
        if not created_reply:
            return jsonify({
                "success": False,
                "error": "Error retrieving created reply"
            }), 500
        
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
    
@reply_bp("/<reply_id>", methods=["PUT", "PATCH"])
@jwt_required()
def update_reply(reply_id):
    """Update reply"""
    try:
        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({
                "success": False,
                "error": "User not found"
            }), 404
        
        reply_model = Reply(current_app.db, current_app.supabase)
        reply = reply_model.find_by_id(reply_id)

        if not reply:
            return jsonify({
                "success": False,
                "error": "Reply not found"
            }), 404
        
        if str(reply["user_id"]) != user_id:
            return jsonify({
                "success": False,
                "error": "Unauthorized to update this reply."
            }), 403
        
        data = request.get_json()
        if not data:
            return jsonify({
                "success": False,
                "error": "No data provided",
                "details": "Request body is empty"
            }), 400
        
        update_data = {}
        if "content" in data:
            update_data["content"] = bleach.clean(
                str(data["content"]).strip(),
                tags=["p", "br", "strong", "em", "u", "code", "pre", "blockquote"],
                strip=True
            )

        success, error = reply_model.update_reply(reply_id, update_data)

        if not success:
            return jsonify({
                "success": False,
                "error": "Failed to update reply",
                "details": error
            }), 400
        
        updated_reply = reply_model.find_by_id(reply_id)
        if not updated_reply:
            return jsonify({
                "success": "Error retrieving updated reply",
                "error": "Error retrieving updated reply"
            }), 500
        
        serialized_reply = serialize_mongo_doc({
            "_id": updated_reply["_id"],
            "comment_id": updated_reply["comment_id"],
            "user_id": updated_reply["user_id"],
            "content": updated_reply["content"],
            "created_at": updated_reply["created_at"],
            "updated_at": updated_reply["updated_at"]
        })

        return jsonify({
            "success": True,
            "message": "Reply updated successfully",
            "data": serialized_reply
        })
    
    except Exception as e:
        current_app.logger.error(f"Error updating reply: {str(e)}")
        return jsonify({
            "success": False,
            "error": "error updating reply",
            "details": str(e)
        }), 500

@reply_bp.route("/<reply_id>", methods="DELETE")
@jwt_required()
def delete_reply(reply_id):
    """Delete a reply"""
    try:
        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({
                "success": False,
                "error": "User not found"
            }), 404
        
        reply_model = Reply(current_app.db, current_app.supabase)
        reply = reply_model.find_by_id(reply_id)

        if not reply:
            return jsonify({
                "success": False,
                "error": "Reply not found"
            }), 404
        
        if str(reply["user_id"]) != user_id:
            return jsonify({
                "success": False,
                "error": "Unauthorized to delete this reply"
            }), 403
        
        success, error = reply_model.delete_reply(reply_id)

        if not success:
            return jsonify({
                "success": False,
                "error": "Failed to delete the reply",
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
    
@reply_bp.route("comments/<comment_id>", methods=["GET"])
def list_comment_replies(comment_id):
    """Get replies"""
    try:
        reply_model = Reply(current_app.db, current_app.supabase)
        replies, total = reply_model.get_replies_by_comment(comment_id)

        serialized_replies = serialize_mongo_doc(replies)

        return jsonify({
            "success": True,
            "data": {
                "comments": serialized_replies,
                "total": total
            }
        })
    
    except Exception as e:
        current_app.logger.error(f"Error listing replies: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Error retrieving replies",
            "details": str(e)
        }), 500