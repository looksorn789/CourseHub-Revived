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
                "tags" : tags
            }
            return self.collection.insert_one(forum_data)

        except Exception as e:
            return None, str(e)

    def find_by_name(self, name):
        # Search for a forum by email in MongoDB
        return self.collection.find_one({"name": name})

    def update_name(
            self,
            name,
            updatedName
    ):

        self.collection.update_one({"name" : name}, {"$set": {"name":updatedName}})

    def update_description(
            self,
            description,
            updatedDescription
    ):

        self.collection.update_one({"description" : description}, {"$set": {"description":updatedDescription}})

    def update_tags(
            self,
            tags,
            updatedTags
    ):

        self.collection.update_one({"tags" : tags}, {"$set": {"tags":updatedTags}})
