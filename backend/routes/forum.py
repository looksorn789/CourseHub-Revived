from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from pymongo.errors import PyMongoError
from models.forum import Forum
from models.user import UserModel
from datetime import datetime

forum_bp = Blueprint("forum_bp", __name__)

@forum_bp.route("/", methods=["POST"])
@jwt_required()
def create_forum():
    data = request.get_json()
    name = data.get("name")
    description = data.get("description")
    tags = data.get("tags")
    #creator_id = data.get("creator_id")
    #member_list = data.get("member_list")

    user_token = get_jwt_identity()
    user_model = UserModel(current_app.db, current_app.supabase)
    user_id = str(user_model.get_user_by_supabase_id(user_token)["_id"])

    # Checks if any inputs are null
    if not all([name, description, tags]):
        return jsonify({"message": "Name, description, and at least one tag are required"}), 400

    forum_model = Forum(current_app.db, current_app.supabase)

    # Error checking by name
    if not all(str(letter).isalpha() or str(letter).isspace() for letter in name ):
        return jsonify({"message": "Forum name must be alphabet characters only"}), 409

    if forum_model.find_by_name(name) is not None and forum_model.find_by_name(name).get("name").upper() == str(name).upper():
        return jsonify({"message": "Forum name already exists"}), 409

    # Error checking by description
    if not isinstance(description, str):
        return jsonify({"message": "Description must be a string object"})

    if len(description) > 100:
        return jsonify({"message": "Description must me less than 100 characters"})

    # Error checking tags

    if not isinstance(tags, list):
        return jsonify({"message": "Tags must be a list object"})

    if len(tags) > 5:
        return jsonify({"message": "Must include no more than 5 tags"})

    for item in tags:
        if not isinstance(item, str):
            return jsonify({"message": "Tags must be string objects"})

    try:
        forum_model.create_forum(
            name = name,
            description = description,
            tags = tags,
            creator_id = user_id,
            creation_date = datetime.now().strftime("%m-%d-%Y %H:%M:%S"),
            member_list = [user_id],
            member_count = 1
        )
    except PyMongoError as e:
        return jsonify({"message": "Database error", "details": str(e)}), 500

    return jsonify({"message": "Forum created successfully."}), 201

@forum_bp.route("/", methods=["PATCH"])
def update_forum():
    data = request.get_json()


    name = data.get("name")
    updated_name = data.get("updated_name")

    description = data.get("description")
    updated_description = data.get("updated_description")

    tags = data.get("tags")
    updated_tags = data.get("updated_tags")

    forum_model = Forum(current_app.db, current_app.supabase)

    if name is None:
        return jsonify({"message:": "No forum selected to update"})

    if updated_name is not None:
        if forum_model.find_by_description("description") != description:
            return jsonify({"message": "old description is not the same"})
        if name.upper() == updated_name.upper():
            return jsonify({"message": "Names are already the same"})

        try:
            forum_model.update_name(name, updated_name)
        except PyMongoError as e:
            return jsonify({"message": "Database error", "details": str(e)}), 500

    if updated_description is not None:
        if len(str(updated_description)) > 100:
            return jsonify({"message": "Updated description must me less than 100 characters"})
        try:
            forum_model.update_description(description, updated_description)
        except PyMongoError as e:
            return jsonify({"message": "Database error", "details": str(e)}), 500

    if updated_tags is not None:
        if tags == updated_tags:
            return jsonify({"message": "Tags are already the same"})

        try:
            forum_model.update_tags(tags, updated_tags)
        except PyMongoError as e:
            return jsonify({"message": "Database error", "details": str(e)}), 500

    return jsonify({"message": "Updated forum"})

def add_member():
    data = request.get_json()

    member_to_add = data.get("member_to_add")
    forum_model = Forum(current_app.db, current_app.supabase)

    forum_model.add_member()
