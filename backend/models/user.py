from datetime import datetime

class UserModel:
    def __init__(self, db, supabase):
        self.collection = db["users"]
        self.supabase = supabase

    def create_user(
        self,
        email,
        username,
        supabase_user_id=None,
        verified=False,
        verification_code=None,
        verification_code_expiry=None,
    ):
        try:
            user_data = {
                "supabase_id": supabase_user_id,
                "email": email,
                "username": username,
                "verified": verified,
                "verification_code": verification_code,
                "verification_code_expiry": verification_code_expiry,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "profile_completed": False,  # Initially false as profile isn't set up yet
            }
            result = self.collection.insert_one(user_data)
            return result.inserted_id, None
        except Exception as e:
            return None, str(e)


    def create_initial_profile(self, supabase_id, profile_data):
        """Create the initial profile for a new user"""
        try:
            avatar_config = {
                "style": profile_data.get('avatarStyle', 'adventurer'),
                "seed": f"{profile_data.get('firstName')}{profile_data.get('lastName')}",
                "options": profile_data.get('avatarOptions', {})
            }

            # Transform frontend data to match our schema
            profile = {
                "profile": {
                    "first_name": profile_data.get('firstName'),
                    "last_name": profile_data.get('lastName'),
                    "bio": profile_data.get('bio'),
                    "school": profile_data.get('school'),
                    "major": profile_data.get('major'),
                    "graduation_date": profile_data.get('graduationDate'),
                    "gpa": profile_data.get('gpa'),
                    "interests": profile_data.get('selectedTopics', []),
                    "awards": profile_data.get('awards', []),
                    "clubs": profile_data.get('clubs', []),
                    "certifications": profile_data.get('certifications', []),
                    "avatar_config": avatar_config
                },
                "profile_completed": True,
                "updated_at": datetime.utcnow()
            }

            # Check if profile already exists
            existing_user = self.collection.find_one(
                {"supabase_id": supabase_id, "profile_completed": True}
            )
            
            if existing_user:
                return None, "Profile already exists"

            # Create the initial profile
            result = self.collection.update_one(
                {"supabase_id": supabase_id},
                {"$set": profile}
            )

            if result.modified_count == 0:
                return None, "User not found"

            return True, None
        except Exception as e:
            return None, str(e)

    def find_by_email(self, email):
        return self.collection.find_one({"email": email})

    def get_user_by_supabase_id(self, supabase_id):
        return self.collection.find_one({"supabase_id": supabase_id})