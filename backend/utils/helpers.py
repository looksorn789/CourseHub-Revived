from bson import ObjectId
from datetime import datetime
from flask import current_app
from models.user import UserModel

def serialize_mongo_doc(doc):
    """Convert MongoDB document to JSON serializable format"""
    if isinstance(doc, dict):
        return {k: serialize_mongo_doc(v) for k, v in doc.items()}
    elif isinstance(doc, list):
        return [serialize_mongo_doc(item) for item in doc]
    elif isinstance(doc, ObjectId):
        return str(doc)
    elif isinstance(doc, datetime):
        return doc.isoformat()
    return doc

def get_user_id(supabase_user_id: str):
    """Get user ID from Supabase user ID"""
    user_model = UserModel(current_app.db, current_app.supabase)
    user = user_model.get_user_by_supabase_id(supabase_user_id)
    return str(user["_id"]) if user else None