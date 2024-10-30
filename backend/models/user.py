from datetime import datetime
from bson import ObjectId

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

    def serialize_user(self, user_data):
        """Serialize user data for JSON response"""
        if not user_data:
            return None
            
        if "_id" in user_data:
            user_data["_id"] = str(user_data["_id"])
            
        user_data.pop("verification_code", None)
        user_data.pop("verification_code_expiry", None)
        
        return user_data

    def validate_profile_data(self, profile_data):
        """Validate profile data fields"""
        required_fields = {
            "firstName": "First name",
            "lastName": "Last name",
            "school": "School",
            "major": "Major"
        }
        
        missing_fields = []
        for field, name in required_fields.items():
            if not profile_data.get(field):
                missing_fields.append(name)
                
        return missing_fields

    def create_initial_profile(self, supabase_id, profile_data):
        """Create the initial profile for a new user"""
        try:
            missing_fields = self.validate_profile_data(profile_data)
            if missing_fields:
                return None, f"Missing required fields: {', '.join(missing_fields)}"

            avatar_config = {
                "style": profile_data.get("avatarStyle", "adventurer"),
                "seed": f"{profile_data.get('firstName')}{profile_data.get('lastName')}",
                "options": profile_data.get("avatarOptions", {}),
            }

            profile = {
                "profile": {
                    "first_name": profile_data.get("firstName"),
                    "last_name": profile_data.get("lastName"),
                    "bio": profile_data.get("bio", ""),
                    "school": profile_data.get("school"),
                    "major": profile_data.get("major"),
                    "graduation_date": profile_data.get("graduationDate"),
                    "gpa": profile_data.get("gpa"),
                    "interests": profile_data.get("selectedTopics", []),
                    "awards": profile_data.get("awards", []),
                    "clubs": profile_data.get("clubs", []),
                    "certifications": profile_data.get("certifications", []),
                    "avatar_config": avatar_config,
                },
                "profile_completed": True,
                "updated_at": datetime.utcnow(),
            }

            result = self.collection.find_one_and_update(
                {
                    "supabase_id": supabase_id,
                    "profile_completed": False
                },
                {"$set": profile},
                return_document=True
            )

            if not result:
                return None, "Profile already exists or user not found"

            return self.serialize_user(result), None

        except Exception as e:
            return None, str(e)

    def update_user_profile(self, supabase_id, profile_data, email=None, username=None):
        """Update user profile with validation"""
        try:
            update_data = {"updated_at": datetime.utcnow()}
            
            if email:
                update_data["email"] = email
                
            if username:
                update_data["username"] = username

            profile_updates = {}
            for key, value in profile_data.items():
                # Convert camelCase to snake_case for database
                db_key = ''.join(['_'+c.lower() if c.isupper() else c for c in key]).lstrip('_')
                profile_updates[f"profile.{db_key}"] = value

            if profile_updates:
                update_data.update(profile_updates)

            result = self.collection.find_one_and_update(
                {"supabase_id": supabase_id},
                {"$set": update_data},
                return_document=True
            )

            if not result:
                return None, "User not found"

            return self.serialize_user(result), None

        except Exception as e:
            return None, str(e)

    def get_user_profile(self, supabase_id):
        """Get user profile with formatted response"""
        try:
            user = self.collection.find_one({"supabase_id": str(supabase_id)})
            if not user:
                return None, "User not found"

            return self.serialize_user(user), None

        except Exception as e:
            return None, str(e)

    def find_by_email(self, email):
        """Find user by email with serialization"""
        try:
            user = self.collection.find_one({"email": email})
            return self.serialize_user(user)
        except Exception as e:
            print(f"Error finding user by email: {e}")
            return None

    def get_user_by_supabase_id(self, supabase_id):
        """Get user by supabase_id with serialization"""
        try:
            user = self.collection.find_one({"supabase_id": str(supabase_id)})
            return self.serialize_user(user)
        except Exception as e:
            print(f"Error getting user by supabase_id: {e}")
            return None