from datetime import datetime
from enum import Enum
from typing import Dict
from bson import ObjectId
from flask import current_app

class CommentStatus(Enum):
    ACTIVE = "active"
    DELECTED = "deleted"
    HIDDEN = "hidden"

class Comment:
    # Field Validation rules
    COMMENT_FIELDS = {
        "content": {
            "type": str,
            "required": True,
            "min_length": 10,
            "max_length": 1000,
            "error": "Content must be between 10 and 1000 characters",
        },
        "post_id": {
            "type": str,
            "required": True,
            "error": "Post ID is required",
        },
    }

    def __init__(self, db, supabase):
        self.collection = db["comments"]
        self.supabase = supabase

    # Insert comment into the database
    def create_comment(self, data: Dict):
        try:
            with self.collection.database.client.start_session() as session:
                with session.start_transaction():
                    # Validate comment data
                    is_valid, errors = self.validate_comment_data(data)
                    if not is_valid:
                        return None, errors
                    
                    comment_data = {
                        "post_id": ObjectId(data["post_id"]),
                        "author": data["author"],
                        "content": data["content"],
                        "parent_id": data["parent_id"] if data["parent_id"] else None,
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow(),
                        "likes": 0,
                        "reply_count": 0
                    }

                    # Insert post
                    result = self.collection.insert_one(comment_data, session=session)
                    if not result.inserted_id:
                        return None, "Failed to create comment"
                    
                    # Update post comment count 
                    post_collection = self.collection.database.get_collection("posts")
                    update_result = post_collection.update_one(
                        {"_id": ObjectId(data["post_id"])},
                        {"$inc": {"comment_count": 1}},
                        session=session
                    )

                    if update_result.modified_count == 0:
                        return None, "Failed to update forum post count"
                    
                    return str(result.inserted_id), None
        except Exception as e:
                current_app.logger.error(f"Error creating comment: {str(e)}")
                return None, f"Error creating comment: {str(e)}"

    def update_comment(self, comment_id, data:Dict):
        """Update an existing comment"""
        try:
            comment = self.find_by_id(comment_id)
            if not comment:
                return False, "Comment not found"
            
            # Validate update data
            is_valid, errors = self.validate_comment_data(data, is_update = True)
            if not is_valid:
                return False, errors

            current_time = datetime.utcnow()

            # Update content field
            update_data = {"updated_time": current_time}
            if "content" in data:
                update_data["content"] = data["content"].strip()
            
            # Update comment in database
            result = self.collection.update_one(
                {"_id": ObjectId(comment_id)},
                {"$set": update_data}
            )

            return result.modified_count > 0, None

        except Exception as e:
            return False, f"Error updating comment: {str(e)}"
            


    def get_comments_by_post(self, post_id):
        """Get comments from a post"""
        try:
            # Build query
            query = {"post_id": ObjectId(post_id)}

            total = self.collection.count_documents(query)
            comments = list(self.collection.find(query))
            
            # Clean up ObjectID fields
            for comment in comments:
                comment["_id"] = str(comment["_id"])
                comment["post_id"] = str(comment["post_id"])
                comment["user_id"] = str(comment["user_id"])
            
            return comments, total
        
        except Exception as e:
            print(f"Error getting post comments: {str(e)}")
            return [], 0
        
    def find_by_id(self, comment_id):
        """Find comment ID"""
        try:
            return self.collection.find_one({"_id": ObjectId(comment_id)})
        except Exception:
            return None

    def delete_comment(self, comment_id):
        """Delete a comment"""
        try:
            with self.collection.database.client.start_session() as session:
                with session.start_transaction():
                    comment = self.find_by_id(comment_id)
                    if not comment:
                        return False, "Comment not found"
                    
                    delete_result = self.collection.delete_one(
                        {"_id": ObjectId(comment_id)},
                        session=session
                    )

                    if delete_result.deleted_count == 0:
                        return False, "Failed to delete comment"
                    
                    # Decrement post comment count in post collection
                    post_collection = self.collection.database.get_collection('posts')
                    post_update = post_collection.update_one(
                        {"_id": comment["comment_id"]},
                        {
                            "$inc": {"comment_count": -1},
                            "$set": {"updated_at": datetime.utcnow()}
                        },
                        session=session
                    )

                    if post_update.modified_count == 0:
                        return False, "Failed to update post comment count"
                    return True, None
            
        except Exception as e:
            current_app.logger.error(f"Error deleting comment: {str(e)}")
            return False, f"Error deleting comment: {str(e)}"

    def validate_comment_data(self, data: Dict, is_update: bool = False):
        """Validate comment data"""
        errors = []

        for field_name, rules in self.COMMENT_FIELDS.items():
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