from datetime import datetime
from bson.objectid import ObjectId

class Comment:
    def __init__(self, db):
        self.collection = db["comments"]

    # Insert comment into the database
    def create_comment(self, post_id, author, body, parent_id=None):
        try:
            comment_data = {
                "post_id": ObjectId(post_id),
                "author": author,
                "body": body,
                "parent_id": ObjectId(parent_id) if parent_id else None,
                "date": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
            result = self.collection.insert_one(comment_data)
            return str(result.inserted_id), None
        except Exception as e:
            return None, str(e)

    # Fetch comments for a post
    def get_comments_by_post(self, post_id):
        try:
            comments = self.collection.find({"post_id": ObjectId(post_id)})
            return [
                {
                    "id": str(comment["_id"]),
                    "author": comment["author"],
                    "body": comment["body"],
                    "parent_id": str(comment["parent_id"]) if comment.get("parent_id") else None,
                    "date": comment["date"]
                }
                for comment in comments
            ], None
        except Exception as e:
            return None, str(e)

    # Delete comment
    def delete_comment(self, comment_id):
        try:
            result = self.collection.delete_one({"_id": ObjectId(comment_id)})
            if result.deleted_count == 0:
                return None, "Comment not found"
            return "Comment deleted successfully", None
        except Exception as e:
            return None, str(e)
