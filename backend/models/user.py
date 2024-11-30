from datetime import datetime
from typing import Any, Dict, Optional, Tuple
import re
from bson import ObjectId


class UserModel:

    # Validation patterns for fields
    EMAIL_PATTERN = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    USERNAME_PATTERN = r"^[a-zA-Z0-9_]{3,20}$"
    DATE_PATTERN = r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$"

    # Field definitions with validation rules
    PROFILE_FIELDS = {
        "firstName": {
            "type": str,
            "required": True,
            "min_length": 2,
            "max_length": 50,
            "pattern": r"^[a-zA-Z\s\-']+$",
            "error": "First name must be 2-50 characters, letters only",
        },
        "lastName": {
            "type": str,
            "required": True,
            "min_length": 2,
            "max_length": 50,
            "pattern": r"^[a-zA-Z\s\-']+$",
            "error": "Last name must be 2-50 characters, letters only",
        },
        "bio": {
            "type": str,
            "required": False,
            "max_length": 500,
            "error": "Bio must not exceed 500 characters",
        },
        "school": {
            "type": str,
            "required": True,
            "min_length": 2,
            "max_length": 100,
            "error": "School name must be 2-100 characters",
        },
        "major": {
            "type": str,
            "required": True,
            "min_length": 2,
            "max_length": 100,
            "error": "Major must be 2-100 characters",
        },
        "gpa": {
            "type": (str, float),
            "required": False,
            "min_value": 0,
            "max_value": 4.0,
            "error": "GPA must be between 0 and 4.0",
        },
        "graduationDate": {
            "type": str,
            "required": False,
            "pattern": r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$",
            "error": "Invalid graduation date format",
        },
        "selectedTopics": {
            "type": list,
            "required": False,
            "max_length": 10,
            "error": "Maximum 10 topics allowed",
        },
        "awards": {
            "type": list,
            "required": False,
            "max_length": 10,
            "error": "Maximum 10 awards allowed",
        },
        "clubs": {
            "type": list,
            "required": False,
            "max_length": 10,
            "error": "Maximum 10 clubs allowed",
        },
        "certifications": {
            "type": list,
            "required": False,
            "max_length": 10,
            "error": "Maximum 10 certifications allowed",
        },
    }

    def __init__(self, db, supabase):
        self.collection = db["users"]
        self.supabase = supabase

    def create_user(
        self,
        email: str,
        username: str,
        supabase_user_id: str = None,
        verified: bool = False,
        verification_code: str = None,
        verification_code_expiry: datetime = None,
    ) -> Tuple[str, Optional[str]]:
        """
        Create a new user after initial signup.
        """
        try:
            # Validate required fields
            if not email or not username:
                return None, "Email and username are required"

            # Validate email format
            if not re.match(self.EMAIL_PATTERN, email):
                return None, "Invalid email format"

            # Validate username
            if not re.match(self.USERNAME_PATTERN, username):
                return (
                    None,
                    "Username must be 3-20 characters, alphanumeric and underscores only",
                )

            # Check if email already exists
            if self.find_by_email(email):
                return None, "Email already registered"

            # Create user data
            user_data = {
                "supabase_id": supabase_user_id,
                "email": email.lower(),
                "username": username,
                "verified": verified,
                "verification_code": verification_code,
                "verification_code_expiry": verification_code_expiry,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "profile_completed": False,  # Initially false as profile isn't set up yet
            }

            result = self.collection.insert_one(user_data)

            if not result.inserted_id:
                return None, "Failed to create user"

            return str(result.inserted_id), None

        except Exception as e:
            return None, f"Error creating user: {str(e)}"

    def serialize_user(self, user_data):
        """Serialize user data for JSON response"""
        if not user_data:
            return None

        if "_id" in user_data:
            user_data["_id"] = str(user_data["_id"])

        user_data.pop("verification_code", None)
        user_data.pop("verification_code_expiry", None)

        return user_data

    def validate_field(
        self, field_name: str, value: Any, rules: Dict
    ) -> Tuple[bool, Optional[str]]:
        """Validate a single field against its rules"""
        if value is None:
            if rules.get("required", False):
                return False, f"{field_name} is required"
            return True, None

        if not isinstance(value, rules["type"]):
            return False, f"{field_name} must be of type {rules['type'].__name__}"

        # String validations
        if isinstance(value, str):
            if "min_length" in rules and len(value.strip()) < rules["min_length"]:
                return (
                    False,
                    f"{field_name} must be at least {rules['min_length']} characters",
                )
            if "max_length" in rules and len(value.strip()) > rules["max_length"]:
                return (
                    False,
                    f"{field_name} must not exceed {rules['max_length']} characters",
                )
            if "pattern" in rules and not re.match(rules["pattern"], value):
                return False, rules["error"]

        # Numeric validations
        if isinstance(value, (int, float)):
            if "min_value" in rules and value < rules["min_value"]:
                return False, f"{field_name} must be at least {rules['min_value']}"
            if "max_value" in rules and value > rules["max_value"]:
                return False, f"{field_name} must not exceed {rules['max_value']}"

        # List validations
        if isinstance(value, list):
            if "max_length" in rules and len(value) > rules["max_length"]:
                return (
                    False,
                    f"{field_name} must not exceed {rules['max_length']} items",
                )

        return True, None

    def validate_profile_data(
        self, profile_data: Dict, is_patch: bool = False
    ) -> Tuple[bool, list]:
        """Validate profile data against defined rules"""
        errors = []

        for field_name, rules in self.PROFILE_FIELDS.items():
            if field_name in profile_data:
                is_valid, error = self.validate_field(
                    field_name, profile_data.get(field_name), rules
                )
                if not is_valid:
                    errors.append(error)
            elif rules.get("required", False) and not is_patch:
                errors.append(f"{field_name} is required")

        return len(errors) == 0, errors

    def create_initial_profile(self, supabase_id, profile_data):
        """Create the initial profile for a new user"""
        try:
            is_valid, errors = self.validate_profile_data(profile_data)
            if not is_valid:
                return None, f"Validation errors: {', '.join(errors)}"

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
                {"supabase_id": supabase_id, "profile_completed": False},
                {"$set": profile},
                return_document=True,
            )

            if not result:
                return None, "Profile already exists or user not found"

            return self.serialize_user(result), None

        except Exception as e:
            return None, str(e)

    def update_user_profile(
        self,
        supabase_id: str,
        profile_data: Dict,
        email: str = None,
        username: str = None,
    ) -> Tuple[Dict, Optional[str]]:
        """Update user profile with validation"""
        try:
            # Validate email format if provided
            if email and not re.match(self.EMAIL_PATTERN, email):
                return None, "Invalid email format"

            # Validate username if provided
            if username and not re.match(r"^[a-zA-Z0-9_]{3,20}$", username):
                return (
                    None,
                    "Username must be 3-20 characters, alphanumeric and underscores only",
                )

            # Validate profile data
            is_patch = not all(
                key in profile_data
                for key in ["firstName", "lastName", "school", "major"]
            )
            is_valid, errors = self.validate_profile_data(profile_data, is_patch)

            if not is_valid:
                return None, "\n".join(errors)

            update_data = {"updated_at": datetime.utcnow()}

            if email:
                update_data["email"] = email
            if username:
                update_data["username"] = username

            if profile_data:
                field_mapping = {
                    "firstName": "first_name",
                    "lastName": "last_name",
                    "graduationDate": "graduation_date",
                    "selectedTopics": "interests",
                }

                for key, value in profile_data.items():
                    db_key = field_mapping.get(key, key.lower())
                    update_data[f"profile.{db_key}"] = value

            result = self.collection.find_one_and_update(
                {"supabase_id": supabase_id},
                {"$set": update_data},
                return_document=True,
            )

            if not result:
                return None, "User not found"

            response_data = {
                "email": result.get("email"),
                "username": result.get("username"),
                "profile": {
                    "firstName": result["profile"].get("first_name"),
                    "lastName": result["profile"].get("last_name"),
                    "bio": result["profile"].get("bio"),
                    "school": result["profile"].get("school"),
                    "major": result["profile"].get("major"),
                    "gpa": result["profile"].get("gpa"),
                    "graduationDate": result["profile"].get("graduation_date"),
                    "interests": result["profile"].get("interests", []),
                    "awards": result["profile"].get("awards", []),
                    "clubs": result["profile"].get("clubs", []),
                    "certifications": result["profile"].get("certifications", []),
                },
            }

            return response_data, None

        except Exception as e:
            return None, str(e)

    def get_user_profile(self, supabase_id):
        """Get user profile"""
        try:
            user = self.collection.find_one({"supabase_id": str(supabase_id)})
            if not user:
                return None, "User not found"

            return self.serialize_user(user), None

        except Exception as e:
            return None, str(e)

    def find_by_email(self, email):
        """Find user by email with"""
        try:
            user = self.collection.find_one({"email": email})
            return self.serialize_user(user)
        except Exception as e:
            print(f"Error finding user by email: {e}")
            return None
        
    def find_by_id(self, user_id):
        """Find user by ID"""
        try:
            return self.collection.find_one({"_id": ObjectId(user_id)})
        except Exception as e:
            print(f"Error finding user by ID: {e}")
            return None

    def get_user_by_supabase_id(self, supabase_id):
        """Get user by supabase_id with serialization"""
        try:
            user = self.collection.find_one({"supabase_id": str(supabase_id)})
            return self.serialize_user(user)
        except Exception as e:
            print(f"Error getting user by supabase_id: {e}")
            return None

    def find_by_username(self, username: str):
        """Find user by username"""
        try:
            return self.collection.find_one({"username": username})
        except Exception as e:
            print(f"Error finding user by username: {e}")
            return None
        
    def search_users(self, query: str, limit: int = 20):
        """Search users by name, username, school, or major"""
        try:
            # text index if it doesn't exist
            self.collection.create_index([
                ("username", "text"),
                ("profile.first_name", "text"),
                ("profile.last_name", "text"),
                ("profile.school", "text"),
                ("profile.major", "text")
            ])

            # search query
            search_query = {
                "$or": [
                    {"username": {"$regex": query, "$options": "i"}},
                    {"profile.first_name": {"$regex": query, "$options": "i"}},
                    {"profile.last_name": {"$regex": query, "$options": "i"}},
                    {"profile.school": {"$regex": query, "$options": "i"}},
                    {"profile.major": {"$regex": query, "$options": "i"}}
                ]
            }

            return list(self.collection.find(search_query).limit(limit))

        except Exception as e:
            print(f"Error searching users: {e}")
            return []