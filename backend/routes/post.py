from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from pymongo.errors import PyMongoError
from models.post import Post
from datetime import date

post_bp = Blueprint("post_bp", __name__)

@post_bp.route("/", methods=["POST"])
@jwt_required
def create_post():
    user_id = get_jwt_identity()
    data = request.get_json()
    title = data.get("title")
    body = data.get("body")
    tags = data.get("tags")
    forum_id = data.get("forum_id")
    creator_id = data.get("creator_id")
    creation_date = data.get("creation_date")
    like_count = data.get("like_count")
    

    # Checks if any inputs are null
    if not all([title, body,
        creator_id,
    ]):
        return jsonify({"message": "Title, body, and creator_id are required"}), 400

    post_model = Post(current_app.db, current_app.supabase)

    # if len(body) > 100:
    #     return jsonify({"message": "Description must me less than 100 characters"})

    # Error checking tags

    if not isinstance(tags, list):
        return jsonify({"message": "Tags must be a list object"})

    if len(tags) > 5:
        return jsonify({"message": "Must include no more than 5 tags"})

    for item in tags:
        if not isinstance(item, str):
            return jsonify({"message": "Tags must be string objects"})

    try:
        post_model.create_forum(
               name = title,
                body = body,
                tags = tags,
                forum_id = forum_id,
                creator_id =  creator_id,
                creation_date = date.today(),
                like_count = like_count
        )
    except PyMongoError as e:
        return jsonify({"message": "Database error", "details": str(e)}), 500

    return jsonify({"message": "Forum created successfully."}), 201

@post_bp.route('/', methods=['GET'])
def get_posts():
    post_model = Post(current_app.db, current_app.supabase)
    posts, error = post_model.get_all_posts()
    if error:
        return jsonify({'error': error}), 500
    return jsonify(posts), 200