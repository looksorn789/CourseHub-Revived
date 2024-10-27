class Post:
    def create_post(
        self,
        title,
        body,
        tags,
        creator_id,
        creation_date,
        like_count
    ):
        try:
            post_data = {
                "name" : title,
                "body" : body,
                "tags" : tags,
                "creator_id" : creator_id,
                "creation_date" : creation_date,
                "like_count" : like_count
            }
            return self.collection.insert_one(post_data)

        except Exception as e:
            return None, str(e)