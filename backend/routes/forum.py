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

    tags = [-1, -1, -1, -1, -1]
    
    name = data.get("name")
    description = data.get("description")
    tags = data.get("tags")


    forum_model = Forum(current_app.db, current_app.supabase)

    forum_data = {
        "name": name,
        "description": description,
        "tags": {
            "tag0": tags[0]
        }
    }

    for tag in tags:
        if tag not in forum_data["tags"].values():
            forum_data

    forum_model.collection.insert_one(forum_data)

    return jsonify({"message": "Forum created successfully."}), 201 