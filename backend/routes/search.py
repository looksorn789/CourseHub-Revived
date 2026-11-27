"""Global search: people, channels and posts."""
import re
from concurrent.futures import ThreadPoolExecutor

from bson import ObjectId
from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from models.forum import ForumStatus, ForumVisibility
from models.post import Post
from utils.cache import hidden_forums as hidden_forums_cache
from utils.helpers import get_user_id, serialize_mongo_doc

search_bp = Blueprint("search_bp", __name__)

USER_FIELDS = {
    "username": 1,
    "created_at": 1,
    "profile.first_name": 1,
    "profile.last_name": 1,
    "profile.major": 1,
    "profile.school": 1,
    "profile.avatar_config": 1,
}
FORUM_FIELDS = {"name": 1, "slug": 1, "category": 1, "member_count": 1, "avatar_url": 1, "created_at": 1}


def hidden_forum_ids(db, user_id):
    """Forums whose content the user can't see: inactive ones, and private
    ones they aren't a member of. Cached briefly; forum routes clear the
    cache whenever memberships or visibility change."""
    return hidden_forums_cache.get_or_set(user_id, lambda: [
        f["_id"]
        for f in db["forums"].find(
            {
                "$or": [
                    {"status": {"$ne": ForumStatus.ACTIVE.value}},
                    {"visibility": ForumVisibility.PRIVATE.value, "members.user_id": {"$ne": user_id}},
                ]
            },
            {"_id": 1},
        )
    ])


def _visible_forums_query(user_id):
    return {
        "status": ForumStatus.ACTIVE.value,
        "$or": [{"visibility": {"$ne": ForumVisibility.PRIVATE.value}}, {"members.user_id": user_id}],
    }


def _run_parallel(**jobs):
    """Run independent queries at the same time (each is a network round trip)."""
    with ThreadPoolExecutor(max_workers=len(jobs)) as pool:
        futures = {name: pool.submit(fn) for name, fn in jobs.items()}
        return {name: f.result() for name, f in futures.items()}


@search_bp.route("/suggestions", methods=["GET"])
@jwt_required()
def suggestions():
    """Shown when the search box is opened: newest accounts and channels."""
    try:
        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({"success": False, "error": "User not found"}), 404
        db = current_app.db
        results = _run_parallel(
            people=lambda: list(
                db["users"].find(
                    {"profile_completed": True, "_id": {"$ne": ObjectId(user_id)}}, USER_FIELDS
                ).sort("created_at", -1).limit(6)
            ),
            channels=lambda: list(
                db["forums"].find(_visible_forums_query(user_id), FORUM_FIELDS)
                .sort("created_at", -1).limit(8)
            ),
        )
        return jsonify({"success": True, "data": serialize_mongo_doc(results)})
    except Exception as e:
        current_app.logger.error(f"Error loading search suggestions: {str(e)}")
        return jsonify({"success": False, "error": "Error loading suggestions"}), 500


@search_bp.route("", methods=["GET"])
@search_bp.route("/", methods=["GET"])
@jwt_required()
def search():
    """Search people (name, username, major, school), channels (name,
    description, category, tags) and posts (title, content, tags)."""
    try:
        query_text = (request.args.get("q") or "").strip()[:100]
        if len(query_text) < 2:
            return jsonify({"success": True, "data": {"people": [], "channels": [], "posts": []}})
        limit = min(max(int(request.args.get("limit", 5)), 1), 20)

        user_id = get_user_id(get_jwt_identity())
        if not user_id:
            return jsonify({"success": False, "error": "User not found"}), 404

        db = current_app.db
        pattern = {"$regex": re.escape(query_text), "$options": "i"}
        post_model = Post(db, current_app.supabase)

        def find_posts():
            hidden = hidden_forum_ids(db, user_id)
            posts, _ = post_model.list_posts_with_authors(
                {
                    "forum_id": {"$nin": hidden},
                    "$or": [{"title": pattern}, {"content": pattern}, {"tags": pattern}],
                },
                per_page=limit,
                sort_field="created_at",
                include_forum=True,
                viewer_id=user_id,
            )
            return posts

        results = _run_parallel(
            people=lambda: list(
                db["users"].find(
                    {
                        "profile_completed": True,
                        "$or": [
                            {"username": pattern},
                            {"profile.first_name": pattern},
                            {"profile.last_name": pattern},
                            {"profile.major": pattern},
                            {"profile.school": pattern},
                        ],
                    },
                    USER_FIELDS,
                ).sort("created_at", -1).limit(limit)
            ),
            channels=lambda: list(
                db["forums"].find(
                    {
                        "$and": [
                            _visible_forums_query(user_id),
                            {"$or": [
                                {"name": pattern},
                                {"description": pattern},
                                {"category": pattern},
                                {"tags": pattern},
                            ]},
                        ]
                    },
                    FORUM_FIELDS,
                ).sort("member_count", -1).limit(limit)
            ),
            posts=find_posts,
        )
        for post in results["posts"]:
            post["content"] = (post.get("content") or "")[:200]
        return jsonify({"success": True, "data": serialize_mongo_doc(results)})

    except ValueError:
        return jsonify({"success": False, "error": "Invalid limit"}), 400
    except Exception as e:
        current_app.logger.error(f"Error searching: {str(e)}")
        return jsonify({"success": False, "error": "Error searching"}), 500
