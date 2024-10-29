class Post:
    def __init__(self, db, supabase):
        self.collection = db["posts"]
        self.supabase = supabase
        
    def create_post(
        self,
        title,
        body,
        tags,
        forum_id,
        creator_id,
        creation_date,
        like_count
    ):
        try:
            post_data = {
                "title" : title,
                "body" : body,
                "tags" : tags,
                "forum_id" : forum_id,
                "creator_id" : creator_id,
                "creation_date" : creation_date,
                "like_count" : like_count
            }
            return self.collection.insert_one(post_data)

        except Exception as e:
            return None, str(e)