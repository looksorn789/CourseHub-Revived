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


# Returns forum given a correct forum_id
@forum_bp.route("/<forum_id>", methods=["GET"])
def get_forum(forum_id):
    forum_model = Forum(current_app.db, current_app.supabase)

    forum = forum_model.find_forum_id(forum_id)

    if forum:
        return jsonify(forum)
    else:
        return jsonify({"message": "Forum not found"}), 404


@forum_bp.route("/<forum_id>", methods=["PATCH"])
@jwt_required()
def update_forum(forum_id):
    data = request.get_json()

    # data parsed from the JSON request
    updated_name = data.get("updated_name")
    updated_description = data.get("updated_description")
    tags_to_add = data.get("tags_to_add")
    tags_to_delete = data.get("tags_to_delete")
    add_user = data.get("add_user")
    remove_user = data.get("remove_user")

    # Current forum and forum id
    forum_model = Forum(current_app.db, current_app.supabase)
    current_forum = forum_model.find_by_id(forum_id)

    # Forum objects that will be updated
    name = current_forum["name"]
    description = current_forum["description"]
    tags = current_forum["tags"]
    member_list = current_forum["member_list"]
    member_count = current_forum["member_count"]

    # Current user object for session information
    user_model = UserModel(current_app.db, current_app.supabase)
    user_token = get_jwt_identity()
    user_id = str(user_model.get_user_by_supabase_id(user_token)["_id"])

    # Checks if forum name is being updated
    if updated_name is not None:
        if name.upper() == updated_name.upper():
            return jsonify({"message": "Names are already the same"})

        try:
            forum_model.update_name(name, updated_name)
        except PyMongoError as e:
            return jsonify({"message": "Database error", "details": str(e)}), 500

    # Checks if forum description is being updated
    if updated_description is not None:
        if len(str(updated_description)) > 100:
            return jsonify({"message": "Updated description must me less than 100 characters"})
        if description.upper() == updated_description.upper():
            return jsonify({"message": "Updated description is the same as original description"})

        try:
            forum_model.update_description(description, updated_description)
        except PyMongoError as e:
            return jsonify({"message": "Database error", "details": str(e)}), 500

    # Checks if forum tags are being delted
    if tags_to_delete is not None:
        if len(tags) < 1:
            return jsonify({"message": "Cannot delete as no tags exist yet"})
        for tag in tags_to_delete:
            if tag not in tags:
                return jsonify({"message": "One or more tags do not exist in current tags"})

        try:
            for tag in tags_to_delete:
                forum_model.delete_tag(forum_id, tag)
        except PyMongoError as e:
            return jsonify({"message": "Database error", "details": str(e)}), 500

    # Checks if forum tags are being added
    if tags_to_add is not None:
        if len(tags) >= 5:
            return jsonify({"message": "Tags list already contains max number of tags (5)"})
        for tag in tags_to_add:
            if tag in tags:
                return jsonify({"message": "Cannot add duplicate tags to forum"})

        try:
            for tag in tags_to_add:
                forum_model.add_tag(forum_id, tag)
        except PyMongoError as e:
            return jsonify({"message": "Database error", "details": str(e)}), 500

    # Adds new member to the forum member list
    if add_user is True:
        if user_id in member_list:
            return jsonify({"message": "User already subscribed to this forum"})

        try:
            forum_model.add_member(forum_id, user_id, member_count)
        except PyMongoError as e:
            return jsonify({"message": "Database error", "details": str(e)}), 500

    # Removes current member from forum member list
    if remove_user is True:
        if user_id not in member_list:
            return jsonify({"message": "User not subscribed to this forum"})

        try:
            forum_model.remove_member(forum_id, user_id, member_count)
        except PyMongoError as e:
            return jsonify({"message": "Database error", "details": str(e)}), 500

    return jsonify({"message": "Updated forum"})