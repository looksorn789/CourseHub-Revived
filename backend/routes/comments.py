from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.comment import Comment, CommentStatus
from models.user import UserModel
from models.post import Post
import bleach
from bson import ObjectId
from typing import Optional

comment_bp = Blueprint('comment_bp', __name__)

def get_user_id(supabase_user_id: str) -> Optional[str]:
    """Get MongoDB user ID from Supabase ID"""
    try:
        user_model = UserModel(current_app.db, current_app.supabase)
        user = user_model.get_user_by_supabase_id(supabase_user_id)
        return str(user["_id"]) if user else None
    except Exception as e:
        current_app.logger.error(f"Error getting user ID: {str(e)}")
        return None

def get_user_info(user_id: str) -> Optional[dict]:
    """Get user information for comment display"""
    try:
        user_model = UserModel(current_app.db, current_app.supabase)
        user = user_model.find_by_id(user_id)
        if user:
            return {
                "username": user.get("username"),
                "profile": {
                    "first_name": user.get("profile", {}).get("first_name"),
                    "last_name": user.get("profile", {}).get("last_name"),
                    "avatar_config": user.get("profile", {}).get("avatar_config")
                }
            }
        return None
    except Exception as e:
        current_app.logger.error(f"Error getting user info: {str(e)}")
        return None

@comment_bp.route('/post/<post_id>/comments', methods=['POST'])
@jwt_required()
def create_comment(post_id):
    """Create a new comment or reply"""
    try:
        # Get user
        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({"success": False, "error": "User not found"}), 404

        # Validate post exists
        post_model = Post(current_app.db, current_app.supabase)
        post = post_model.find_by_id(post_id)
        if not post:
            return jsonify({"success": False, "error": "Post not found"}), 404

        # Get and validate request data
        data = request.get_json()
        if not data:
            return jsonify({
                "success": False,
                "error": "No data provided",
                "details": "Request body is empty"
            }), 400

        # Clean and prepare comment data
        comment_data = {
            "post_id": post_id,
            "user_id": user_id,
            "content": bleach.clean(
                str(data.get("content", "")).strip(),
                tags=["p", "br", "strong", "em", "code"],
                strip=True
            ),
            "parent_id": data.get("parent_id"),
            "mentioned_user": data.get("mentioned_user")
        }

        # If this is a reply, validate parent comment exists
        if comment_data["parent_id"]:
            comment_model = Comment(current_app.db, current_app.supabase)
            parent_comment = comment_model.find_by_id(comment_data["parent_id"])
            if not parent_comment:
                return jsonify({"success": False, "error": "Parent comment not found"}), 404

        # Create comment
        comment_model = Comment(current_app.db, current_app.supabase)
        comment_id, error = comment_model.create_comment(comment_data)

        if error:
            return jsonify({
                "success": False,
                "error": "Failed to create comment",
                "details": error
            }), 400

        # Get created comment
        created_comment = comment_model.find_by_id(comment_id)
        if not created_comment:
            return jsonify({
                "success": False,
                "error": "Error retrieving created comment"
            }), 500

        # Get user info for response
        user_info = get_user_info(str(created_comment["user_id"]))

        # Format response
        response_data = {
            "id": str(created_comment["_id"]),
            "post_id": str(created_comment["post_id"]),
            "user_id": str(created_comment["user_id"]),
            "user_info": user_info,
            "content": created_comment["content"],
            "parent_id": str(created_comment["parent_id"]) if created_comment.get("parent_id") else None,
            "mentioned_user": created_comment.get("mentioned_user"),
            "created_at": created_comment["created_at"],
            "updated_at": created_comment["updated_at"],
            "likes": created_comment["likes"],
            "reply_count": created_comment["reply_count"],
            "metadata": created_comment.get("metadata", {})
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

@comment_bp.route('/post/<post_id>/comments', methods=['GET'])
def get_comments(post_id):
    """Get comments with their replies for a post"""
    try:
        page = int(request.args.get("page", 1))
        per_page = min(int(request.args.get("per_page", 20)), 50)

        comment_model = Comment(current_app.db, current_app.supabase)
        comments, total = comment_model.get_comments_with_replies(
            post_id,
            page=page,
            per_page=per_page
        )

        # Add user info to each comment
        for comment in comments:
            comment["user_info"] = get_user_info(comment["user_id"])

        return jsonify({
            "success": True,
            "data": {
                "comments": comments,
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
        current_app.logger.error(f"Error getting comments: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Error retrieving comments",
            "details": str(e)
        }), 500

@comment_bp.route('/comments/<comment_id>', methods=['PATCH'])
@jwt_required()
def update_comment(comment_id):
    """Update a comment"""
    try:
        # Get user
        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({"success": False, "error": "User not found"}), 404

        # Get comment
        comment_model = Comment(current_app.db, current_app.supabase)
        comment = comment_model.find_by_id(comment_id)

        if not comment:
            return jsonify({"success": False, "error": "Comment not found"}), 404

        # Check ownership
        if str(comment["user_id"]) != user_id:
            return jsonify({
                "success": False,
                "error": "Unauthorized to update this comment"
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

        # Update comment
        success, error = comment_model.update_comment(comment_id, update_data)

        if not success:
            return jsonify({
                "success": False,
                "error": "Failed to update comment",
                "details": error
            }), 400

        # Get updated comment
        updated_comment = comment_model.find_by_id(comment_id)
        if not updated_comment:
            return jsonify({
                "success": False,
                "error": "Error retrieving updated comment"
            }), 500

        # Get user info
        user_info = get_user_info(str(updated_comment["user_id"]))

        return jsonify({
            "success": True,
            "message": "Comment updated successfully",
            "data": {
                "id": str(updated_comment["_id"]),
                "content": updated_comment["content"],
                "user_info": user_info,
                "updated_at": updated_comment["updated_at"],
                "metadata": updated_comment.get("metadata", {})
            }
        })

    except Exception as e:
        current_app.logger.error(f"Error updating comment: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Error updating comment",
            "details": str(e)
        }), 500

@comment_bp.route('/comments/<comment_id>/like', methods=['POST'])
@jwt_required()
def toggle_like(comment_id):
    """Toggle like status for a comment"""
    try:
        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({"success": False, "error": "User not found"}), 404

        comment_model = Comment(current_app.db, current_app.supabase)
        success, message = comment_model.toggle_like(comment_id, user_id)

        if not success:
            return jsonify({
                "success": False,
                "error": message
            }), 400

        return jsonify({
            "success": True,
            "message": message
        })

    except Exception as e:
        current_app.logger.error(f"Error toggling like: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Error toggling like",
            "details": str(e)
        }), 500

@comment_bp.route('/comments/<comment_id>', methods=['DELETE'])
@jwt_required()
def delete_comment(comment_id):
    """Delete a comment"""
    try:
        # Get user
        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({"success": False, "error": "User not found"}), 404

        # Get comment
        comment_model = Comment(current_app.db, current_app.supabase)
        comment = comment_model.find_by_id(comment_id)

        if not comment:
            return jsonify({"success": False, "error": "Comment not found"}), 404

        # Check ownership
        if str(comment["user_id"]) != user_id:
            return jsonify({
                "success": False,
                "error": "Unauthorized to delete this comment"
            }), 403

        # Delete comment
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

# Error handlers
@comment_bp.errorhandler(400)
def handle_bad_request(e):
    return jsonify({"error": "Bad Request", "message": str(e)}), 400

@comment_bp.errorhandler(401)
def handle_unauthorized(e):
    return jsonify({"error": "Unauthorized", "message": "Authentication required"}), 401

@comment_bp.errorhandler(403)
def handle_forbidden(e):
    return jsonify({"error": "Forbidden", "message": "Insufficient permissions"}), 403

@comment_bp.errorhandler(404)
def handle_not_found(e):
    return jsonify({"error": "Not Found", "message": str(e)}), 404

@comment_bp.errorhandler(500)
def handle_server_error(e):
    current_app.logger.error(f"Server error: {str(e)}")
    return jsonify({
        "error": "Internal Server Error",
        "message": "An unexpected error occurred"
    }), 500