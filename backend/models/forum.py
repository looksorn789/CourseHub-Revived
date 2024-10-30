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
        member_count,
        posts
    ):
        try:
            forum_data = {
                "name" : name,
                "description" : description,
                "tags" : tags,
                "creator_id" : creator_id,
                "creation_date" : creation_date,
                "member_list" : member_list,
                "member_count" : member_count,
                "posts": posts
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

    # Updates current forum name
    def update_name(self, name, updatedName):
        self.collection.update_one({"name" : name}, {"$set": {"name":updatedName}})

    # Updates current forum description
    def update_description(self,description, updatedDescription):
        self.collection.update_one({"description" : description}, {"$set": {"description":updatedDescription}})

    # Adds tag_to_add to list of tags
    def add_tag(self, forum_id, tag_to_add):
        object_id = ObjectId(forum_id)
        self.collection.update_one({"_id": object_id}, {"$push": {"tags": tag_to_add}})

    # Deletes tag_to_delete from list of tags
    def delete_tag(self, forum_id, tag_to_delete):
        object_id = ObjectId(forum_id)
        self.collection.update_one({"_id": object_id}, {"$pull": {"tags": tag_to_delete}})

    # Adds new member to forum (user subscribes to forum)
    def add_member(self, forum_id, user_to_add, member_count):
        object_id = ObjectId(forum_id)
        self.collection.update_one({"_id": object_id}, {"$push": {"member_list": user_to_add}})
        self.collection.update_one({"_id": object_id}, {"$set": {"member_count": member_count + 1}})

    # Removes current member from forum (user unsubscribes from forum)
    def remove_member(self, forum_id, user_to_delete, member_count):
        object_id = ObjectId(forum_id)
        self.collection.update_one({"_id": object_id}, {"$pull": {"member_list": user_to_delete}})
        self.collection.update_one({"_id": object_id}, {"$set": {"member_count": member_count - 1}})

    # Deletes forum, deleting children posts and comments
    def delete_forum(self, forum_id):
        object_id = ObjectId(forum_id)
        self.collection.delete_one({"_id": object_id})
