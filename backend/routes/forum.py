from flask import Blueprint, url_for, request, jsonify, current_app
import boto3
from botocore.exceptions import ClientError
import requests

from pymongo.errors import PyMongoError

from models.forum import Forum


forum_bp = Blueprint("forum_bp", __name__)

@forum_bp.route("/create", methods=["POST"])
def create_forum():
    data = request.get_json()

    name = data.get("name")
    description = data.get("description")
    tags = data.get("tags")

    # Checks if any inputs are null
    if name is None or description is None or tags is None:
        return jsonify({"message": "Name, description, and at least one tag are required"}), 400

    forum_model = Forum(current_app.db, current_app.supabase)

    
    # Error checking by name
    if not str(name).isalpha():
        return jsonify({"message": "Forum name must be alphabet characters only"}), 409
    
    if forum_model.find_by_name(name) is not None and forum_model.find_by_name(name).get("name").upper() == str(name).upper():
        return jsonify({"message": "Forum name already exists"}), 409
    
    # Error checking by description

    if len(description) > 100:
        return jsonify({"message": "Description must me less than 100 characters"})
    
    # Error checking tags

    if not isinstance(tags, list):
        return jsonify({"message": "Tags must be a list object"})

    '''if not str(forum_model.find_by_name(name).get("name")).isalpha():
        return jsonify({"message": "Forum name must be alphabet characters only"}), 409

    if forum_model.find_by_name(name).get("name").upper() == str(name).upper():
        return jsonify({"message": "Forum name already exists"}), 409
    
    # Error checking by description

    if len(forum_model.find_by_name(name).get("description")) > 100:
        return jsonify({"message": "Description must me less than 100 characters"})'''
    
    

    forum_data = forum_model.create_forum(
        name = name,
        description = description,
        tags = tags
    )


    return jsonify({"message": "Forum created successfully."}), 201 