from flask import Blueprint, url_for, request, jsonify, current_app
import boto3
from botocore.exceptions import ClientError
import requests

from pymongo.errors import PyMongoError

from models.settings import Settings
from models.user import UserModel


settings_bp = Blueprint("settings_bp", __name__)

@settings_bp.route("/settings", methods=["PATCH"])
def update_settings():
    data = request.get_json()

    notification = data.get("notification")

    if notification is not None:
        #swap notification
        pass