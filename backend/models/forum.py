class Forum:
    def __init__(self, db, supabase):
        self.collection = db["forums"]
        self.supabase = supabase

    def create_forum(
        self,
        name,
        description,
        tags

    ):
        try:
            forum_data = {
                "name" : name,
                "description" : description,
                "tag" : tags
            }
            result = self.collection.insert_one(forum_data)
            return result.inserted_id, None
        except Exception as e:
            return None, str(e)

    def find_by_name(self, name):
        # Search for a forum by email in MongoDB
        return self.collection.find_one({"name": name})

    def find_by_tags(self, givenTags):
        # Search for a forum by tags in MongoDB
        for i in givenTags:
            if i not in self.collection.tag:
                return None, "Tag not found"
        return self.collection.find({"tag": tags})