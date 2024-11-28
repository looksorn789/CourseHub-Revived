from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import UserModel
from models.comment import Comment
from utils.helpers import serialize_mongo_doc
from typing import Optional
from bson import ObjectId
from datetime import datetime
import bleach

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

@comment_bp.route('/post/<post_id>/comments', methods=['GET'])
def get_comments(post_id):
    """Get comments with threads for a post"""
    try:
        page = int(request.args.get("page", 1))
        per_page = min(int(request.args.get("per_page", 20)), 50)
        sort_by = request.args.get("sort", "recent")

        current_app.logger.debug(f"Fetching comments for post: {post_id}")
        current_app.logger.debug(f"Page: {page}, Per page: {per_page}, Sort: {sort_by}")

        comment_model = Comment(current_app.db, current_app.supabase)
        comments, total = comment_model.get_comments_with_threads(
            post_id,
            page=page,
            per_page=per_page,
            sort_by=sort_by
        )

        current_app.logger.debug(f"Found {len(comments)} comments")

        # Get liked comments for authenticated user - now with proper auth check
        try:
            from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
            # Only try to get likes if there's a valid JWT
            if verify_jwt_in_request(optional=True):
                supabase_user_id = get_jwt_identity()
                if supabase_user_id:
                    user_id = get_user_id(supabase_user_id)
                    if user_id:
                        # Get all comment IDs (including replies)
                        comment_ids = []
                        for comment in comments:
                            comment_ids.append(comment["_id"])
                            comment_ids.extend(reply["_id"] for reply in comment.get("replies", []))

                        # Get liked comments
                        liked_comments = comment_model.get_user_comment_likes(user_id, comment_ids)

                        # Add liked status to comments and replies
                        for comment in comments:
                            comment["liked"] = comment["_id"] in liked_comments
                            for reply in comment.get("replies", []):
                                reply["liked"] = reply["_id"] in liked_comments
        except Exception as e:
            current_app.logger.warning(f"Error processing likes: {str(e)}")
            # Continue without likes if there's an error

        # Serialize the response
        serialized_comments = serialize_mongo_doc(comments)

        response_data = {
            "success": True,
            "data": {
                "comments": serialized_comments,
                "total": total,
                "page": page,
                "per_page": per_page,
                "total_pages": (total + per_page - 1) // per_page
            }
        }

        current_app.logger.debug("Successfully fetched comments")
        return jsonify(response_data)

    except Exception as e:
        current_app.logger.error(f"Error getting comments: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Error retrieving comments",
            "details": str(e)
        }), 500

@comment_bp.route('/post/<post_id>/comments', methods=['POST'])
@jwt_required()
def create_comment(post_id):
    """Create a new comment"""
    try:
        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({
                "success": False,
                "error": "User not found"
            }), 404

        data = request.get_json()
        if not data:
            return jsonify({
                "success": False,
                "error": "No data provided"
            }), 400

        # Prepare comment data
        comment_data = {
            "post_id": post_id,
            "user_id": user_id,
            "content": data.get("content")
        }

        current_app.logger.debug(f"Creating comment for post: {post_id}")
        comment_model = Comment(current_app.db, current_app.supabase)
        comment, error = comment_model.create_comment(comment_data)

        if error:
            return jsonify({
                "success": False,
                "error": "Failed to create comment",
                "details": error
            }), 400

        # Ensure we have the full comment data with user info
        if comment:
            # Serialize the response
            serialized_comment = serialize_mongo_doc(comment)
            
            current_app.logger.debug(f"Created comment: {serialized_comment}")

            return jsonify({
                "success": True,
                "message": "Comment created successfully",
                "data": serialized_comment
            }), 201
        else:
            return jsonify({
                "success": False,
                "error": "Failed to create comment"
            }), 500

    except Exception as e:
        current_app.logger.error(f"Error creating comment: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Error creating comment",
            "details": str(e)
        }), 500

@comment_bp.route('/<comment_id>/replies', methods=['POST'])
@jwt_required()
def create_reply(comment_id):
    """Create a reply to a comment"""
    try:
        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({
                "success": False,
                "error": "User not found"
            }), 404

        data = request.get_json()
        if not data:
            return jsonify({
                "success": False,
                "error": "No data provided"
            }), 400

        # Get parent comment for post_id
        comment_model = Comment(current_app.db, current_app.supabase)
        parent_comment = comment_model.find_by_id(comment_id)
        
        if not parent_comment:
            return jsonify({
                "success": False,
                "error": "Parent comment not found"
            }), 404

        # Prepare reply data
        reply_data = {
            "post_id": parent_comment["post_id"],  # Use parent comment's post_id
            "user_id": user_id,
            "content": data.get("content"),
            "parent_id": comment_id  # Set the parent_id to the comment we're replying to
        }

        current_app.logger.debug(f"Creating reply to comment: {comment_id}")
        
        # Create the reply using the same model
        created_reply, error = comment_model.create_comment(reply_data)

        if error:
            return jsonify({
                "success": False,
                "error": "Failed to create reply",
                "details": error
            }), 400

        # Serialize the response
        serialized_reply = serialize_mongo_doc(created_reply)

        return jsonify({
            "success": True,
            "message": "Reply created successfully",
            "data": serialized_reply
        }), 201

    except Exception as e:
        current_app.logger.error(f"Error creating reply: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Error creating reply",
            "details": str(e)
        }), 500

@comment_bp.route('/<comment_id>', methods=['PATCH'])
@jwt_required()
def update_comment(comment_id):
    """Update a comment or reply"""
    try:
        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({
                "success": False,
                "error": "User not found"
            }), 404

        data = request.get_json()
        if not data or "content" not in data:
            return jsonify({
                "success": False,
                "error": "Content is required"
            }), 400

        current_app.logger.debug(f"Updating comment/reply: {comment_id}")
        comment_model = Comment(current_app.db, current_app.supabase)
        updated_comment, error = comment_model.update_comment(
            comment_id,
            user_id,
            data["content"]
        )

        if error:
            return jsonify({
                "success": False,
                "error": error
            }), 400

        return jsonify({
            "success": True,
            "message": "Comment updated successfully",
            "data": updated_comment
        })

    except Exception as e:
        current_app.logger.error(f"Error updating comment: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Error updating comment",
            "details": str(e)
        }), 500

@comment_bp.route('/<comment_id>', methods=['DELETE'])
@jwt_required()
def delete_comment(comment_id):
    """Delete a comment or reply"""
    try:
        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({
                "success": False,
                "error": "User not found"
            }), 404

        current_app.logger.debug(f"Deleting comment/reply: {comment_id}")
        comment_model = Comment(current_app.db, current_app.supabase)
        success, error = comment_model.delete_comment(comment_id, user_id)

        if not success:
            return jsonify({
                "success": False,
                "error": error
            }), 400

        return jsonify({
            "success": True,
            "message": "Comment deleted successfully"
        })

    except Exception as e:
        current_app.logger.error(f"Error deleting comment: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Error deleting comment",
            "details": str(e)
        }), 500

@comment_bp.route('/<comment_id>/like', methods=['POST'])
@jwt_required()
def toggle_like(comment_id):
    """Toggle like for a comment or reply"""
    try:
        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({
                "success": False,
                "error": "User not found"
            }), 404

        current_app.logger.debug(f"Toggling like for comment/reply: {comment_id}")
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

# Error handlers
@comment_bp.errorhandler(400)
def handle_bad_request(e):
    return jsonify({
        "error": "Bad Request",
        "message": str(e)
    }), 400

@comment_bp.errorhandler(401)
def handle_unauthorized(e):
    return jsonify({
        "error": "Unauthorized",
        "message": "Authentication required"
    }), 401

@comment_bp.errorhandler(403)
def handle_forbidden(e):
    return jsonify({
        "error": "Forbidden",
        "message": "Insufficient permissions"
    }), 403

@comment_bp.errorhandler(404)
def handle_not_found(e):
    return jsonify({
        "error": "Not Found",
        "message": str(e)
    }), 404

@comment_bp.errorhandler(500)
def handle_server_error(e):
    current_app.logger.error(f"Server error: {str(e)}")
    return jsonify({
        "error": "Internal Server Error",
        "message": "An unexpected error occurred",
        "details": str(e)
    }), 500