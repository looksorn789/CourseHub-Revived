from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.post import Post, PostType
from utils.helpers import serialize_mongo_doc, get_user_id
from utils.storage import POST_IMAGE_BUCKET, read_image_upload, remove_images, upload_image
import bleach

post_bp = Blueprint("post_bp", __name__)

@post_bp.route("/forum/<forum_id>", methods=["POST"])
@jwt_required()
def create_post(forum_id):
    """Create a new post"""
    try:
        # Get user
        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({"success": False, "error": "User not found"}), 404

        # Get and validate request data
        data = request.get_json()
        if not data:
            return jsonify({
                "success": False,
                "error": "No data provided",
                "details": "Request body is empty"
            }), 400

        # Clean and prepare post data
        post_data = {
            "forum_id": forum_id,
            "user_id": user_id,
            "title": bleach.clean(str(data.get("title", "")).strip()),
            "content": bleach.clean(
                str(data.get("content", "")).strip(),
                tags=["p", "br", "strong", "em", "u", "code", "pre", "blockquote"],
                strip=True
            ),
            "type": str(data.get("type", "")).strip(),
            "tags": [bleach.clean(tag) for tag in data.get("tags", [])][:5]
        }

        # Create post
        post_model = Post(current_app.db, current_app.supabase)
        post_id, error = post_model.create_post(post_data)

        if error:
            return jsonify({
                "success": False,
                "error": "Failed to create post",
                "details": error
            }), 400

        # Get created post
        created_post = post_model.find_by_id(post_id)
        if not created_post:
            return jsonify({
                "success": False,
                "error": "Error retrieving created post"
            }), 500

        # Format response
        response_data = {
            "id": str(created_post["_id"]),
            "forum_id": str(created_post["forum_id"]),
            "user_id": str(created_post["user_id"]),
            "title": created_post["title"],
            "content": created_post["content"],
            "tags": post_data.get("tags", []),
            "images": created_post.get("images", []),
            "type": created_post["type"],
            "created_at": created_post["created_at"],
            "updated_at": created_post["updated_at"],
            "last_activity_at": created_post["last_activity_at"],
            "view_count": created_post["view_count"],
            "metadata": created_post.get("metadata", {})
        }

        return jsonify({
            "success": True,
            "message": "Post created successfully",
            "data": response_data
        }), 201

    except Exception as e:
        current_app.logger.error(f"Error creating post: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Error creating post",
            "details": str(e)
        }), 500


@post_bp.route("/<post_id>", methods=["PUT", "PATCH"])
@jwt_required()
def update_post(post_id):
    """Update post"""
    try:
        # Get user
        supabase_user_id = get_jwt_identity()
        user_id = get_user_id(supabase_user_id)
        if not user_id:
            return jsonify({
                "success": False,
                "error": "User not found"
            }), 404

        # Get post
        post_model = Post(current_app.db, current_app.supabase)
        post = post_model.find_by_id(post_id)

        if not post:
            return jsonify({
                "success": False,
                "error": "Post not found"
            }), 404

        # Check ownership
        if str(post["user_id"]) != user_id:
            return jsonify({
                "success": False,
                "error": "Unauthorized to update this post"
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
        update_data = {}
        if "title" in data:
            update_data["title"] = bleach.clean(str(data["title"]).strip())
        if "content" in data:
            update_data["content"] = bleach.clean(
                str(data["content"]).strip(),
                tags=["p", "br", "strong", "em", "u", "code", "pre", "blockquote"],
                strip=True
            )
        if "type" in data:
            post_type = str(data["type"]).strip()
            if post_type not in [t.value for t in PostType]:
                return jsonify({
                    "success": False,
                    "error": "Invalid post type",
                    "details": f"Type must be one of: {', '.join(t.value for t in PostType)}"
                }), 400
            update_data["type"] = post_type

        # Update post
        success, error = post_model.update_post(post_id, update_data, user_id)

        if not success:
            return jsonify({
                "success": False,
                "error": "Failed to update post",
                "details": error
            }), 400

        # Get updated post
        updated_post = post_model.find_by_id(post_id)
        if not updated_post:
            return jsonify({
                "success": False,
                "error": "Error retrieving updated post"
            }), 500

        # Serialize the complete post data
        serialized_post = serialize_mongo_doc({
            "_id": updated_post["_id"],
            "forum_id": updated_post["forum_id"],
            "user_id": updated_post["user_id"],
            "title": updated_post["title"],
            "content": updated_post["content"],
            "type": updated_post["type"],
            "tags": updated_post.get("tags", []),
            "images": updated_post.get("images", []),
            "created_at": updated_post["created_at"],
            "updated_at": updated_post["updated_at"],
            "last_activity_at": updated_post["last_activity_at"],
            "view_count": updated_post.get("view_count", 0),
            "metadata": {
                "last_edited_by": updated_post["metadata"].get("last_edited_by"),
                "last_edited_at": updated_post["metadata"].get("last_edited_at"),
                "edit_history": updated_post["metadata"].get("edit_history", []),
                "views": updated_post["metadata"].get("views", 0),
                "trending_score": updated_post["metadata"].get("trending_score", 0)
            }
        })

        return jsonify({
            "success": True,
            "message": "Post updated successfully",
            "data": serialized_post
        })

    except Exception as e:
        current_app.logger.error(f"Error updating post: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Error updating post",
            "details": str(e)
        }), 500


@post_bp.route("/<post_id>", methods=["DELETE"])
@jwt_required()
def delete_post(post_id):
    """Delete post"""
    try:
        # Get user
        supabase_user_id = get_jwt_identity()
        user_id = get_user_id(supabase_user_id)
        if not user_id:
            return jsonify({
                "success": False,
                "error": "User not found"
            }), 404

        # Get post
        post_model = Post(current_app.db, current_app.supabase)
        post = post_model.find_by_id(post_id)

        if not post:
            return jsonify({
                "success": False,
                "error": "Post not found"
            }), 404

        # Check ownership
        if str(post["user_id"]) != user_id:
            return jsonify({
                "success": False,
                "error": "Unauthorized to delete this post"
            }), 403

        # Delete post
        success, error = post_model.delete_post(post_id)
        if success:
            remove_images(POST_IMAGE_BUCKET, post.get("images", []))

        if not success:
            return jsonify({
                "success": False,
                "error": "Failed to delete post",
                "details": error
            }), 400

        return jsonify({
            "success": True,
            "message": "Post deleted successfully",
            "data": {"post_id": post_id}
        })

    except Exception as e:
        current_app.logger.error(f"Error deleting post: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Error deleting post",
            "details": str(e)
        }), 500


MAX_POST_IMAGES = 4
MAX_POST_IMAGE_BYTES = 5 * 1024 * 1024


def _own_post_or_error(post_id):
    """(post, None) if the signed-in user wrote the post, else (None, response)."""
    user_id = get_user_id(get_jwt_identity())
    if not user_id:
        return None, (jsonify({"success": False, "error": "User not found"}), 404)
    post = Post(current_app.db, current_app.supabase).find_by_id(post_id)
    if not post:
        return None, (jsonify({"success": False, "error": "Post not found"}), 404)
    if str(post["user_id"]) != user_id:
        return None, (jsonify({"success": False, "error": "Only the author can change this post's photos"}), 403)
    return post, None


@post_bp.route("/<post_id>/images", methods=["POST"])
@jwt_required()
def upload_post_image(post_id):
    """Add a photo to a post (author only, up to MAX_POST_IMAGES)."""
    try:
        post, error_response = _own_post_or_error(post_id)
        if error_response:
            return error_response
        if len(post.get("images", [])) >= MAX_POST_IMAGES:
            return jsonify({"success": False, "error": f"A post can have up to {MAX_POST_IMAGES} photos"}), 400

        image, error = read_image_upload(request.files.get("file"), MAX_POST_IMAGE_BYTES)
        if error:
            return jsonify({"success": False, "error": error}), 400
        image_url = upload_image(POST_IMAGE_BUCKET, str(post["_id"]), "photo", image)

        # Re-check the limit atomically in case of parallel uploads.
        collection = Post(current_app.db, current_app.supabase).collection
        result = collection.update_one(
            {"_id": post["_id"], f"images.{MAX_POST_IMAGES - 1}": {"$exists": False}},
            {"$push": {"images": image_url}, "$set": {"updated_at": datetime.utcnow()}},
        )
        if result.modified_count == 0:
            remove_images(POST_IMAGE_BUCKET, [image_url])
            return jsonify({"success": False, "error": f"A post can have up to {MAX_POST_IMAGES} photos"}), 400

        images = collection.find_one({"_id": post["_id"]}, {"images": 1}).get("images", [])
        return jsonify({"success": True, "image_url": image_url, "images": images}), 201

    except Exception as e:
        current_app.logger.error(f"Error uploading post image: {str(e)}")
        return jsonify({"success": False, "error": "Error uploading photo"}), 500


@post_bp.route("/<post_id>/images", methods=["DELETE"])
@jwt_required()
def delete_post_image(post_id):
    """Remove one photo from a post by its URL (author only)."""
    try:
        post, error_response = _own_post_or_error(post_id)
        if error_response:
            return error_response
        image_url = (request.get_json(silent=True) or {}).get("url")
        if not image_url or image_url not in post.get("images", []):
            return jsonify({"success": False, "error": "Photo not found on this post"}), 404

        collection = Post(current_app.db, current_app.supabase).collection
        collection.update_one(
            {"_id": post["_id"]},
            {"$pull": {"images": image_url}, "$set": {"updated_at": datetime.utcnow()}},
        )
        remove_images(POST_IMAGE_BUCKET, [image_url])
        images = collection.find_one({"_id": post["_id"]}, {"images": 1}).get("images", [])
        return jsonify({"success": True, "images": images})

    except Exception as e:
        current_app.logger.error(f"Error removing post image: {str(e)}")
        return jsonify({"success": False, "error": "Error removing photo"}), 500


@post_bp.route("/forum/<forum_id>", methods=["GET"])
def list_forum_posts(forum_id):
    """Get posts for a forum with pagination"""
    try:
        page = int(request.args.get("page", 1))
        per_page = min(int(request.args.get("per_page", 20)), 50)
        post_type = request.args.get("type")

        # Validate post type if provided
        if post_type and post_type not in [t.value for t in PostType]:
            return jsonify({
                "success": False,
                "error": "Invalid post type",
                "details": f"Type must be one of: {', '.join(t.value for t in PostType)}"
            }), 400

        post_model = Post(current_app.db, current_app.supabase)
        posts, total = post_model.get_forum_posts(
            forum_id,
            page=page,
            per_page=per_page,
            post_type=post_type
        )

        # Serialize the posts data
        serialized_posts = serialize_mongo_doc(posts)

        return jsonify({
            "success": True,
            "data": {
                "posts": serialized_posts,
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
        current_app.logger.error(f"Error listing posts: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Error retrieving posts",
            "details": str(e)
        }), 500

@post_bp.route("/", methods=["GET"])
@post_bp.route("", methods=["GET"])
def get_all_posts():
    try:
        page = int(request.args.get("page", 1))
        per_page = min(int(request.args.get("per_page", 20)), 50)
        post_type = request.args.get("type")

        post_model = Post(current_app.db, current_app.supabase)
        query = {}
        if post_type:
            query["type"] = post_type

        total = post_model.collection.count_documents(query)
        posts = list(
            post_model.collection.find(query)
            .sort("created_at", -1)
            .skip((page - 1) * per_page)
            .limit(per_page)
        )

        serialized_posts = serialize_mongo_doc(posts)

        return jsonify({
            "data": {
                "posts": serialized_posts,
                "total": total,
                "page": page,
                "per_page": per_page,
                "total_pages": (total + per_page - 1) // per_page
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Error handlers
@post_bp.errorhandler(400)
def handle_bad_request(e):
    return jsonify({"error": "Bad Request", "message": str(e)}), 400


@post_bp.errorhandler(401)
def handle_unauthorized(_e):
    return jsonify({"error": "Unauthorized", "message": "Authentication required"}), 401


@post_bp.errorhandler(403)
def handle_forbidden(_e):
    return jsonify({"error": "Forbidden", "message": "Insufficient permissions"}), 403


@post_bp.errorhandler(404)
def handle_not_found(e):
    return jsonify({"error": "Not Found", "message": str(e)}), 404


@post_bp.errorhandler(500)
def handle_server_error(e):
    current_app.logger.error(f"Server error: {str(e)}")
    return jsonify({
        "error": "Internal Server Error",
        "message": "An unexpected error occurred"
    }), 500
