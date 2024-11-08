from datetime import datetime
from enum import Enum
from typing import Dict
from bson import ObjectId
from flask import current_app

class Reply:
    # Field Validation rules
    REPLY_FIELDS = {
        "content": {
            "type": str,
            "required": True,
            "min_length": 10,
            "max_length": 500,
            "error": "Content must be between 10 and 500 characters",
        },
        "comment_id": {
            "type": str,
            "required": True,
            "error": "Comment ID is required",
        },
    }

    def __init__(self, db, supabase):
        self.collection = db["replies"]
        self.supabase = supabase

    def create_reply(self, data: Dict):
        """Create a reply to a comment"""
        try:
            with self.collection.database.client.start_session() as session:
                with session.start_transaction():
                    # Validate reply data
                    is_valid, errors = self.validate_reply(data)
                    if not is_valid:
                        return None, errors
                    
                    current_time = datetime.utcnow()

                    reply_data = {
                        "comment_id": ObjectId(data["post_id"]),
                        "user_id": ObjectId(data["user_id"]),
                        "content": data["content"].strip(),
                        "created_at": current_time,
                        "updated_at": current_time
                    }

                    # Insert reply
                    result = self.collection.insert_one(reply_data, session=session)
                    if not result.inserted_id:
                        return None, "Failed to create reply"
                    
                    # Update comment reply count 
                    comment_collection = self.collection.database.get_collection("comments")
                    update_result = comment_collection.update_one(
                        {"_id": ObjectId(data["comment_id"])},
                        {"$inc": {"reply_count": 1}},
                        session=session
                    )

                    if update_result.modified_count == 0:
                        return None, "Failed to update comment reply count"
                    
                    return str(result.inserted_id), None
        except Exception as e:
            current_app.logger.error(f"Error creating post: {str(e)}")
            return None, f"Error creating post: {str(e)}"

    def update_reply(self, reply_id, data:Dict):
        """Update an existing comment"""
        try:
            reply = self.find_by_id(reply_id)
            if not reply:
                return False, "Reply not found"
            
            # Validate update data
            is_valid, errors = self.validate_reply_data(data, is_update = True)
            if not is_valid:
                return False, errors

            current_time = datetime.utcnow()

            # Update content field
            update_data = {"updated_at": current_time}
            if "content" in data:
                update_data["content"] = data["content"].strip()
            
            # Update comment in database
            result = self.collection.update_one(
                {"_id": ObjectId(reply_id)},
                {"$set": update_data}
            )

            return result.modified_count > 0, None

        except Exception as e:
            return False, f"Error updating reply: {str(e)}"
        
    def find_by_id(self, reply_id):
        """Find reply by ID"""
        try:
            return self.collection.find_one({"_id": ObjectId(reply_id)})
        except Exception:
            return None

    def get_replies_by_comment(self, comment_id):
        try:
            # Build query
            query = {"comment_id": ObjectId(comment_id)}

            total = self.collection.count_documents(query)
            replies = list(self.collection.find(query))

            for reply in replies:
                reply["_id"] = str(reply["_id"])
                reply["comment_id"] = str(reply["comment_id"])
                reply["user_id"] = str(reply["user_id"])

            return replies, total

        except Exception as e:
                print(f"Error getting comment replies: {str(e)}")
                return [], 0

    def delete_reply(self, reply_id):
        """Deletes a reply"""
        try:
            with self.collection.database.client.start_session() as session:
                with session.start_transaction():
                    reply = self.find_by_id(reply_id)
                    if not reply:
                        return False, "Reply not found"
                    
                    # Decrement comment reply count in comment collection
                    comment_collection = self.collection.database.get_collection("comments")
                    comment_update = comment_collection.update_one(
                        {"_id": reply["comment_id"]},
                        {
                            "$inc": {"reply_count": -1},
                            "$set": {"updated_at": datetime.utcnow()}
                        },
                        session=session
                    )

                    if comment_update.modified_count == 0:
                        return False, "Failed to update comment reply count"
                    
                    return True, None

        except Exception as e:
            current_app.logger.error(f"Error deleting reply: {str(e)}")
            return False, f"Error deleting reply: {str(e)}"

    def validate_reply(self, data: Dict, is_update: bool = False):
        """Validate reply data"""
        errors = []

        for field_name, rules in self.REPLY_FIELDS.items():
            if field_name in data:
                # Type validation
                if not isinstance(data[field_name], rules["type"]):
                    errors.append(f"{field_name} must be of type {rules["type"].__name__}")
                
                # String validations
                if isinstance(data[field_name], str):
                    if "min_length" in rules and len(data[field_name].strip()) < rules["min_length"]:
                        errors.append(f"{field_name} must be at least {rules['min_length']} characters")
                    if "max_length" in rules and len(data[field_name].strip()) > rules["max_length"]:
                        errors.append(f"{field_name} must not exceed {rules['max_length']} characters")

            elif rules.get("required", False) and not is_update:
                errors.append(f"{field_name} is required")
        
        return len(errors) == 0, "\n".join(errors) if errors else None