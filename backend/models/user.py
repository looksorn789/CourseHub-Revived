import bcrypt
class UserModel:
    def __init__(self, db, supabase):
        self.collection = db["users"]
        self.supabase = supabase

    def create_user(
        self,
        email,
        username,
        password,
        supabase_user_id=None,
        verified=False,
        verification_code=None,
        verification_code_expiry=None,
    ):
        
        try:
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            user_data = {
                "supabase_id": supabase_user_id,
                "email": email,
                "username": username,
                "password": hashed_password,
                "verified": verified,
                "verification_code": verification_code,
                "verification_code_expiry": verification_code_expiry,
            }
            result = self.collection.insert_one(user_data)
            return result.inserted_id, None
        except Exception as e:
            return None, str(e)

    def check_password(self, email, password):
        user = self.find_by_email(email)
        if user and 'password' in user:
            # Compare the plain text password with the hashed password
            return bcrypt.checkpw(password.encode('utf-8'), user['password'])
        return False  # User not found or password not stored
    
    def find_by_email(self, email):
        return self.collection.find_one({"email": email})

    def get_user_by_supabase_id(self, supabase_id):
        return self.collection.find_one({"supabase_id": supabase_id})
