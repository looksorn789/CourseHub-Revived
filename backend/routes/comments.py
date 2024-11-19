from flask import Blueprint, request, jsonify, current_app
from typing import Optional
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import UserModel
from models.post import Post, PostType
from models.comment import Comment
from utils.helpers import serialize_mongo_doc
import bleach

comment_bp = Blueprint("comment_bp", __name__)

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

@comment_bp.route("/posts/<post_id>", methods=["POST"])
@jwt_required()
def create_comment(post_id):
    """Create a new comment"""
    try:
        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({"success":  False, "error": "User not found"}), 404
    
        data = request.get_json()
        if not data:
            return jsonify({
                "success": False,
                "error": "No data provided",
                "details": "Request body is empty"
            }), 400
        
        comment_data = {
            "post_id": post_id,
            "user_id": user_id,
            "content": bleach.clean(
                str(data.get("content", "")).strip(),
                tags=["p", "br", "strong", "em", "u", "code", "pre", "blockquote"],
                strip=True
            )
        }

        comment_model = Comment(current_app.db, current_app.supabase)
        comment_id, error = comment_model.create_comment(comment_data)

        if error:
            return jsonify({
                "success": False,
                "error": "Failed to create comment",
                "details": error
            }), 400
        
        created_comment = comment_model.find_by_id(comment_id)
        if not created_comment:
            return jsonify({
                "success": False,
                "error": "Error retreiving created comment"
            }), 500
        
        response_data = {
            "id": str(created_comment["_id"]),
            "post_id": str(created_comment["post_id"]),
            "user_id": str(created_comment["user_id"]),
            "content": created_comment["content"],
            "created_at": created_comment["created_at"],
            "updated_at": created_comment["updated_at"],
            "likes": created_comment["likes"],
            "reply_count": created_comment["reply_count"]
        }

        return jsonify({
            "success": True,
            "message": "Comment created successfully",
            "data": response_data
        }), 201
    
    except Exception as e:
        current_app.logger.error(f"Error creating comment: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Error creating comment",
            "details": str(e)
        }), 500
    
@comment_bp.route("/<comment_id>", methods=["PUT", "PATCH"])
@jwt_required()
def update_comment(comment_id):
    """Update comment"""
    try:
        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({
                "success": False,
                "error": "User not found"
            }), 404
        
        comment_model = Comment(current_app.db, current_app.supabase)
        comment = comment_model.find_by_id(comment_id)

        if not comment:
            return jsonify({
                "success": False,
                "error": "Comment not found"
            }), 404
        
        if str(comment["user_id"]) != user_id:
            return jsonify({
                "success": False,
                "error": "Unauthorized to update this comment."
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

        success, error = comment_model.update_comment(comment_id, update_data)

        if not success:
            return jsonify({
                "success": False,
                "error": "Failed to update comment",
                "details": error
            }), 400
        
        updated_comment = comment_model.find_by_id(comment_id)
        if not updated_comment:
            return jsonify({
                "success": False,
                "error": "Error retreiving updated comment"
            }), 500
        
        serialized_comment = serialize_mongo_doc({
            "_id": updated_comment["_id"],
            "post_id": updated_comment["post_id"],
            "user_id": updated_comment["user_id"],
            "content": updated_comment["content"],
            "created_at": updated_comment["created_at"],
            "updated_at": updated_comment["updated_at"],
            "likes": updated_comment["likes"],
            "reply_count": updated_comment["reply_count"]
        })

        return jsonify({
            "success": True,
            "message": "Post updated successfully",
            "data": serialized_comment
        })
    
    except Exception as e:
        current_app.logger.error(f"Error updating comment: {str(e)}")
        return jsonify({
            "success": False,
            "Error": "Error updating comment",
            "details": str(e)
        }), 500
    
@comment_bp.route("/<comment_id>", methods=["DELETE"])
@jwt_required()
def delete_comment(comment_id):
    """Delete a comment"""
    try:
        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({
                "success": False,
                "error": "User not found"
            }), 404
        
        comment_model = Comment(current_app.db, current_app.supabase)
        comment = comment_model.find_by_id(comment_id)

        if not comment:
            return jsonify({
                "success": False,
                "error": "Comment not found"
            }), 404
        
        if str(comment["user_id"]) != user_id:
            return jsonify({
                "success": False,
                "error": "Unauthorized to delete this comment."
            }), 403
        
        success, error = comment_model.delete_comment(comment_id)

        if not success:
            return jsonify({
                "success": False,
                "error": "Failed to delete comment",
                "details": error
            }), 400
        
        return jsonify({
            "success": True,
            "message": "Comment deleted successfully",
            "data": {"comment_id": comment_id}
        })
    
    except Exception as e:
        current_app.logger.error(f"Error deleting comment: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Error deleting comment",
            "details": str(e)
        }), 500
    
@comment_bp.route("/posts/<post_id>", methods=["GET"])
def list_post_comments(post_id):
    """Get comments for a specific post"""
    try:
        comment_model = Comment(current_app.db, current_app.supabase)
        comments, total = comment_model.get_comments_by_post(post_id)

        serialized_comments = serialize_mongo_doc(comments)

        return jsonify({
            "success": True,
            "data": {
                "posts": serialized_comments,
                "total": total
            }
        })
    
    except Exception as e:
        current_app.logger.error(f"Error listing comments: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Error retrieving comments",
            "details": str(e)
        }), 500