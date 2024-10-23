from datetime import datetime
from bson.objectid import ObjectId

class Post:
    def __init__(self, db, supabase):
        self.collection = db["posts"]
        self.supabase = supabase

    def create_post(self, title, body, author, forum, attachment_id=None, tags=None):
        try:
            post_data = {
                "title": title,
                "body": body,
                "author": author,
                "forum": forum,
                "attachment_id": attachment_id,
                "tags": tags if tags else [],
                "likes": 0,
                "date": datetime.now().strftime('%m-%d-%Y %H:%M:%S'),
                "comments": []
            }
            result = self.collection.insert_one(post_data)
            return str(result.inserted_id), None
        except Exception as e:
            return None, str(e)
        
    def get_all_posts(self):
        try:
            posts = self.collection.find()
            return [
                {
                    "id": str(post["_id"]),
                    "title": post["title"],
                    "body": post["body"],
                    "author": post["author"],
                    "forum": post["forum"],
                    "tags": post.get("tags", []),
                    "attachment_id": post.get("attachment_id", None),
                    "likes": post.get("likes", 0),
                    "date": post["date"],
                    "comments": post["comments"]
                }
                for post in posts
            ], None
        except Exception as e:
            return None, str(e)
        
    def update_post(self, post_id, update_fields):
        try:
            result = self.collection.update_one({"_id": ObjectId(post_id)}, {"$set": update_fields})
            if result.matched_count == 0:
                return None, "Post not found"
            return "Post updated successfully", None
        except Exception as e:
            return None, str(e)
        
    def delete_post(self, post_id):
        try: 
            result = self.collection.delete_one({"_id": ObjectId(post_id)})
            if result.matched_count == 0:
                return None, "Post not found"
            return "Post deleted successfully", None
        except Exception as e:
            return None, str(e)
        
    def find_by_forum(self, forum):
        return list(self.collection.find({"forum": forum}))
    
    def get_posts_by_titles(self, title):
        return list(self.collection.find({"title": {"$regex": title, "$options": "i"}}))