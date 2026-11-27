"""Chat REST API. Every route checks the caller is a participant."""
from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from models.chat import MAX_GROUP_SIZE, MAX_MESSAGE_LENGTH, Chat
from models.forum import ForumVisibility
from models.post import Post
from routes.search import hidden_forum_ids
from chat_socket import conversation_room, socketio, user_room
from utils.helpers import get_user_id, serialize_mongo_doc

messages_bp = Blueprint("messages_bp", __name__)


def _me():
    return get_user_id(get_jwt_identity())


def _not_found():
    return jsonify({"success": False, "error": "Conversation not found"}), 404


def _membership(conversation_id):
    """(user_id, chat, conversation) or None if the caller isn't a participant."""
    user_id = _me()
    if not user_id:
        return None
    chat = Chat(current_app.db)
    conv = chat.get_for_member(conversation_id, user_id)
    if conv is None:
        return None
    return user_id, chat, conv


def _shared_post_snapshot(post_id: str, sender_id: str, conv: dict):
    """(snapshot, None) for a post the sender may share into this chat, else
    (None, error). Posts in private channels can only be shared when every
    participant is a member of that channel."""
    try:
        oid = ObjectId(post_id)
    except InvalidId:
        return None, "Post not found"
    db = current_app.db
    posts, _ = Post(db, current_app.supabase).list_posts_with_authors(
        {"_id": oid, "forum_id": {"$nin": hidden_forum_ids(db, sender_id)}},
        per_page=1,
        include_forum=True,
    )
    if not posts:
        return None, "Post not found"
    post = posts[0]
    forum = db["forums"].find_one(
        {"_id": post["forum_id"]}, {"visibility": 1, "members.user_id": 1}
    ) or {}
    if forum.get("visibility") == ForumVisibility.PRIVATE.value:
        members = {m.get("user_id") for m in forum.get("members", [])}
        if not {str(p) for p in conv["participants"]} <= members:
            return None, "This post is in a private channel that not everyone here can see"
    author = post.get("author") or {}
    profile = author.get("profile") or {}
    return {
        "post_id": oid,
        "title": post.get("title", "")[:150],
        "excerpt": (post.get("content") or "")[:160],
        "image": (post.get("images") or [None])[0],
        "forum": {"name": (post.get("forum") or {}).get("name"), "slug": (post.get("forum") or {}).get("slug")},
        "author": {
            "username": author.get("username"),
            "name": f"{profile.get('first_name', '')} {profile.get('last_name', '')}".strip() or author.get("username"),
        },
    }, None


@messages_bp.route("/conversations", methods=["GET"])
@jwt_required()
def list_conversations():
    """The user's conversations, newest activity first, with unread counts."""
    try:
        user_id = _me()
        if not user_id:
            return jsonify({"success": False, "error": "User not found"}), 404
        convs = Chat(current_app.db).summaries(user_id)
        return jsonify({
            "success": True,
            "data": {
                "conversations": serialize_mongo_doc(convs),
                "unread_total": sum(c.get("unread", 0) for c in convs),
            },
        })
    except Exception as e:
        current_app.logger.error(f"Error listing conversations: {str(e)}")
        return jsonify({"success": False, "error": "Error loading conversations"}), 500


@messages_bp.route("/conversations", methods=["POST"])
@jwt_required()
def start_conversation():
    """Start (or reopen) a chat. One other person -> direct, more -> group."""
    try:
        user_id = _me()
        if not user_id:
            return jsonify({"success": False, "error": "User not found"}), 404
        data = request.get_json(silent=True) or {}
        try:
            others = {str(ObjectId(p)) for p in data.get("participant_ids", [])} - {user_id}
        except (InvalidId, TypeError):
            return jsonify({"success": False, "error": "Invalid participant"}), 400
        if not others:
            return jsonify({"success": False, "error": "Pick at least one person"}), 400
        if len(others) + 1 > MAX_GROUP_SIZE:
            return jsonify({"success": False, "error": f"Groups can have up to {MAX_GROUP_SIZE} people"}), 400
        found = current_app.db["users"].count_documents(
            {"_id": {"$in": [ObjectId(o) for o in others]}, "profile_completed": True}
        )
        if found != len(others):
            return jsonify({"success": False, "error": "Some of those people don't exist"}), 400

        chat = Chat(current_app.db)
        conv_id = chat.find_or_create(user_id, list(others), str(data.get("name") or ""))
        summary = chat.summaries(user_id, [conv_id])[0]
        payload = serialize_mongo_doc(summary)
        for member in others:  # show it in their list right away
            socketio.emit("conversation_updated", {"conversation_id": str(conv_id)}, to=user_room(member))
        return jsonify({"success": True, "data": payload}), 201

    except Exception as e:
        current_app.logger.error(f"Error starting conversation: {str(e)}")
        return jsonify({"success": False, "error": "Error starting conversation"}), 500


@messages_bp.route("/conversations/<conversation_id>", methods=["GET"])
@jwt_required()
def get_conversation(conversation_id):
    try:
        membership = _membership(conversation_id)
        if membership is None:
            return _not_found()
        user_id, chat, conv = membership
        return jsonify({"success": True, "data": serialize_mongo_doc(chat.summaries(user_id, [conv["_id"]])[0])})
    except Exception as e:
        current_app.logger.error(f"Error getting conversation: {str(e)}")
        return jsonify({"success": False, "error": "Error loading conversation"}), 500


@messages_bp.route("/conversations/<conversation_id>/messages", methods=["GET"])
@jwt_required()
def list_messages(conversation_id):
    """Messages oldest-first; ?before=<message id> pages further back."""
    try:
        membership = _membership(conversation_id)
        if membership is None:
            return _not_found()
        _, chat, conv = membership
        limit = min(max(int(request.args.get("limit", 30)), 1), 100)
        before = request.args.get("before") or None
        messages = chat.list_messages(conv["_id"], before, limit)
        return jsonify({
            "success": True,
            "data": {"messages": serialize_mongo_doc(messages), "has_more": len(messages) == limit},
        })
    except (InvalidId, ValueError):
        return jsonify({"success": False, "error": "Invalid paging parameters"}), 400
    except Exception as e:
        current_app.logger.error(f"Error listing messages: {str(e)}")
        return jsonify({"success": False, "error": "Error loading messages"}), 500


@messages_bp.route("/conversations/<conversation_id>/messages", methods=["POST"])
@jwt_required()
def send_message(conversation_id):
    try:
        membership = _membership(conversation_id)
        if membership is None:
            return _not_found()
        user_id, chat, conv = membership
        data = request.get_json(silent=True) or {}
        content = str(data.get("content") or "").strip()
        shared_post = None
        if data.get("shared_post_id"):
            shared_post, error = _shared_post_snapshot(str(data["shared_post_id"]), user_id, conv)
            if error:
                return jsonify({"success": False, "error": error}), 400
        if not content and not shared_post:
            return jsonify({"success": False, "error": "Message is empty"}), 400
        if len(content) > MAX_MESSAGE_LENGTH:
            return jsonify({"success": False, "error": f"Messages can be up to {MAX_MESSAGE_LENGTH} characters"}), 400

        message = serialize_mongo_doc(chat.add_message(conv, user_id, content, shared_post))
        socketio.emit("message", message, to=conversation_room(conversation_id))
        for member in conv["participants"]:
            socketio.emit("conversation_updated", {"conversation_id": conversation_id}, to=user_room(member))
        return jsonify({"success": True, "data": message}), 201
    except Exception as e:
        current_app.logger.error(f"Error sending message: {str(e)}")
        return jsonify({"success": False, "error": "Error sending message"}), 500


@messages_bp.route("/conversations/<conversation_id>/read", methods=["POST"])
@jwt_required()
def mark_read(conversation_id):
    try:
        membership = _membership(conversation_id)
        if membership is None:
            return _not_found()
        user_id, chat, conv = membership
        chat.mark_read(conv["_id"], user_id)
        return jsonify({"success": True})
    except Exception as e:
        current_app.logger.error(f"Error marking read: {str(e)}")
        return jsonify({"success": False, "error": "Error updating conversation"}), 500


@messages_bp.route("/messages/<message_id>", methods=["DELETE"])
@jwt_required()
def delete_message(message_id):
    """Delete your own message (others see "message deleted")."""
    try:
        user_id = _me()
        message = Chat(current_app.db).delete_message(message_id, user_id) if user_id else None
        if not message:
            return jsonify({"success": False, "error": "Message not found"}), 404
        payload = serialize_mongo_doc(message)
        socketio.emit("message_deleted", payload, to=conversation_room(payload["conversation_id"]))
        return jsonify({"success": True, "data": payload})
    except Exception as e:
        current_app.logger.error(f"Error deleting message: {str(e)}")
        return jsonify({"success": False, "error": "Error deleting message"}), 500
