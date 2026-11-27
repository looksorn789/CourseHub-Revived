"""Socket.IO for chat: pushes new messages and typing indicators.

All writes go through the REST API (routes/messages.py), which checks
permissions and then emits here. The socket only identifies the user from
their access token and lets them listen to conversations they belong to.
"""
from threading import Lock

from flask import current_app, request
from flask_jwt_extended import decode_token
from flask_socketio import SocketIO, emit, join_room, leave_room

from models.chat import Chat
from utils.helpers import get_user_id

socketio = SocketIO()

# sid -> {"user_id": str, "name": str}
_clients = {}
_clients_lock = Lock()


def user_room(user_id) -> str:
    return f"user_{user_id}"


def conversation_room(conversation_id) -> str:
    return f"conversation_{conversation_id}"


def init_realtime(app):
    origins = {"http://localhost:3000", "http://127.0.0.1:3000"}
    if app.config.get("FRONTEND_URL"):
        origins.add(app.config["FRONTEND_URL"].rstrip("/"))
    socketio.init_app(app, cors_allowed_origins=sorted(origins), async_mode="threading")


def _client():
    with _clients_lock:
        return _clients.get(request.sid)


@socketio.on("connect")
def on_connect(auth):
    """Reject connections without a valid access token."""
    token = (auth or {}).get("token")
    if not token:
        return False
    try:
        identity = decode_token(token)["sub"]
    except Exception:
        return False
    user_id = get_user_id(identity)
    if not user_id:
        return False
    user = current_app.db["users"].find_one(
        {"supabase_id": identity}, {"username": 1, "profile.first_name": 1}
    ) or {}
    name = (user.get("profile") or {}).get("first_name") or user.get("username") or "Someone"
    with _clients_lock:
        _clients[request.sid] = {"user_id": user_id, "name": name}
    join_room(user_room(user_id))
    return True


@socketio.on("disconnect")
def on_disconnect():
    with _clients_lock:
        _clients.pop(request.sid, None)


@socketio.on("join_conversation")
def on_join(data):
    """Listen to a conversation; only its participants may join."""
    client = _client()
    conversation_id = (data or {}).get("conversation_id")
    if not client or not conversation_id:
        return {"ok": False}
    if not Chat(current_app.db).get_for_member(conversation_id, client["user_id"]):
        return {"ok": False, "error": "Not a participant"}
    join_room(conversation_room(conversation_id))
    return {"ok": True}


@socketio.on("leave_conversation")
def on_leave(data):
    conversation_id = (data or {}).get("conversation_id")
    if conversation_id:
        leave_room(conversation_room(conversation_id))


@socketio.on("typing")
def on_typing(data):
    """Relay "typing…" to the other people in a conversation the sender joined."""
    client = _client()
    conversation_id = (data or {}).get("conversation_id")
    if not client or not conversation_id:
        return
    room = conversation_room(conversation_id)
    if room not in socketio.server.rooms(request.sid, namespace="/"):
        return  # never joined (join_conversation checks membership)
    emit(
        "typing",
        {
            "conversation_id": conversation_id,
            "user_id": client["user_id"],
            "name": client["name"],
            "is_typing": bool(data.get("is_typing", True)),
        },
        to=room,
        include_self=False,
    )
