from bson.objectid import ObjectId

class Forum:
    def __init__(self, db, supabase):
        self.collection = db["forums"]
        self.supabase = supabase

    def create_forum(
        self,
        name,
        description,
        tags,
        creator_id,
        creation_date,
        member_list,
        member_count
    ):
        try:
            forum_data = {
                "name" : name,
                "description" : description,
                "tags" : tags,
                "creator_id" : creator_id,
                "creation_date" : creation_date,
                "member_list" : member_list,
                "member_count" : member_count
            }
            return self.collection.insert_one(forum_data)

        except Exception as e:
            return None, str(e)

    # Search for a forum by name in MongoDB
    def find_by_name(self, name):
        return self.collection.find_one({"name": name})
    
    # Turns a forum's id into ObjectId
    def find_forum_id(self, forum_id):
        object_id = ObjectId(forum_id)
        return str(self.collection.find_one({"_id": object_id}))
    
    # Find a specific forum given a forum id
    def find_by_id(self, forum_id):
        object_id = ObjectId(forum_id)
        return self.collection.find_one({"_id": object_id})

    # Search for a forum by description in MongoDB
    def find_by_description(self, description):
        return self.collection.find_one({"description": description})

    def update_name(self, name, updatedName):
        self.collection.update_one({"name" : name}, {"$set": {"name":updatedName}})

    def update_description(self,description, updatedDescription):
        self.collection.update_one({"description" : description}, {"$set": {"description":updatedDescription}})

    # Adds newTag to list of tags
    def add_tag(self, forum_id, newTag):
        object_id = ObjectId(forum_id)
        self.collection.update_one({"_id": object_id}, {"$push": {"tags": newTag}})

    def delete_tag(self, tags, updatedTags):
        self.collection.update_one({"tags" : tags}, {"$set": {"tags":updatedTags}})

    def add_member(self, member_list, user_id):
        member_list.append(user_id)

    def get_members(self, name):
        return self.collection.find_one({"name": name}).get("members_list")