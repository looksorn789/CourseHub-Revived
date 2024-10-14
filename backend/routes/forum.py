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

    forum_model = Forum(current_app.db, current_app.supabase)

    forum_data = {
        "name": name,
        "description": description
    }

    forum_model.collection.insert_one(forum_data)

    return jsonify({"message": "Forum created successfully."}), 201 