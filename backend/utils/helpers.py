from datetime import datetime
from bson import ObjectId
from flask import current_app
from models.user import UserModel
from utils.cache import user_ids as user_id_cache

def serialize_mongo_doc(doc):
    """Convert MongoDB document to JSON serializable format"""
    if isinstance(doc, dict):
        return {k: serialize_mongo_doc(v) for k, v in doc.items()}
    if isinstance(doc, list):
        return [serialize_mongo_doc(item) for item in doc]
    if isinstance(doc, ObjectId):
        return str(doc)
    if isinstance(doc, datetime):
        # Stored times are naive UTC (datetime.utcnow()); mark them as UTC so
        # browsers don't read them as local time.
        return doc.isoformat() + ("Z" if doc.tzinfo is None else "")
    return doc

def get_user_id(supabase_user_id: str):
    """Mongo user id for a Supabase user id (cached; runs on every request)."""
    if not supabase_user_id:
        return None
    cached = user_id_cache.get(supabase_user_id)
    if cached:
        return cached
    user_model = UserModel(current_app.db, current_app.supabase)
    user = user_model.get_user_by_supabase_id(supabase_user_id)
    return user_id_cache.set(supabase_user_id, str(user["_id"])) if user else None
