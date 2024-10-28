from flask import Blueprint, Flask, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from pymongo.errors import PyMongoError
from models.post import Post

post_bp = Blueprint('post_bp', __name__)

@post_bp.route('/', methods=['POST'])
#@jwt_required()
def create_post():
    user_id = "test_user_id"
    data = request.get_json()
    post_model = Post(current_app.db, current_app.supabase)

    title = data.get("title")
    body = data.get("body")
    forum = data.get("forum")

    if not all([title, body, forum]):
        return jsonify({"error": "Missing required fields"}), 400
    
    if len(body.split()) <= 5:
        return jsonify({"message": "Must be more than 5 words"}), 400

    post_id, error = post_model.create_post(
        title=title,
        body=body,
        author=user_id,
        forum=forum,
        attachment_id=data.get('attachment_id'),
        tags=data.get('tags', [])
    )

    if error:
        return jsonify({"error": error}), 500
    return jsonify({'post_id': str(post_id)}), 201

# GET for all posts
@post_bp.route('/', methods=['GET'])
#@jwt_required()
def get_posts():
    post_model = Post(current_app.db, current_app.supabase)
    posts, error = post_model.get_all_posts()
    if error:
        return jsonify({'error': error}), 500
    return jsonify(posts), 200

# GET for a single post
@post_bp.route('/<post_id>', methods=['GET'])
def get_single_post(post_id):
    post_model = Post(current_app.db, current_app.supabase)
    post, error = post_model.get_post(post_id)
    if error:
        return jsonify({'error': error}), 404
    return jsonify(post), 200

@post_bp.route('/<post_id>', methods=['PATCH'])
#@jwt_required()
def update_post(post_id):
    data = request.get_json()
    post_model = Post(current_app.db, current_app.supabase)

    update_fields = {}
    if 'title' in data: update_fields['title'] = data['title']
    if 'body' in data: update_fields['body'] = data['body']
    if 'tags' in data: update_fields['tags'] = data['tags']
    if 'likes' in data: update_fields['likes'] = data['likes']

    if not update_fields:
        return jsonify({'error': "No fields provided to update"}), 400

    message, error = post_model.update_post(post_id, update_fields)
    if error:
        return jsonify({'error': error}), 404
    return jsonify({'message': message}), 200

@post_bp.route('/<post_id>', methods=['DELETE'])
#@jwt_required()
def delete_post(post_id):
    post_model = Post(current_app.db, current_app.supabase)
    message, error = post_model.delete_post(post_id)
    if error:
        return jsonify({'error': error}), 404
    return jsonify({'message': message}), 200

