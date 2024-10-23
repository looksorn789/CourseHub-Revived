from flask import Blueprint, request, jsonify, current_app
from models.comment import Comment

comment_bp = Blueprint('comment_routes', __name__)

# Create a new comment (POST)
@comment_bp.route('/', methods=['POST'])
def create_comment():
    data = request.json
    comment_model = Comment(request.app.db)

    comment_id, error = comment_model.create_comment(
        post_id=data['post_id'],
        author=data['author'],
        body=data['body'],
        parent_id=data.get('parent_id')
    )
    if error:
        return jsonify({'error': error}), 500
    return jsonify({'comment_id': comment_id}), 201

# Get comments for a post (GET)
@comment_bp.route('/post/<post_id>', methods=['GET'])
def get_comments(post_id):
    comment_model = Comment(request.app.db)
    comments, error = comment_model.get_comments_by_post(post_id)
    if error:
        return jsonify({'error': error}), 500
    return jsonify(comments), 200

# Delete a comment (DELETE)
@comment_bp.route('/<comment_id>', methods=['DELETE'])
def delete_comment(comment_id):
    comment_model = Comment(request.app.db)
    message, error = comment_model.delete_comment(comment_id)
    if error:
        return jsonify({'error': error}), 404
    return jsonify({'message': message}), 200
