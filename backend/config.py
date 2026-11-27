import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY")
    SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
    JWT_SECRET_KEY = SUPABASE_JWT_SECRET
    JWT_ALGORITHM = "HS256"
    # Supabase signs user tokens with its asymmetric key (ES256/RS256); projects
    # still on the legacy shared secret use HS256. app.setup_jwt picks the key.
    JWT_DECODE_ALGORITHMS = ["ES256", "RS256", "HS256"]
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"
    JWT_IDENTITY_CLAIM = "sub"
    JWT_DECODE_AUDIENCE = "authenticated"
    JWT_DECODE_ISSUER = os.getenv("SUPABASE_URL") + "/auth/v1"
    JWT_ERROR_MESSAGE_KEY = "msg"
    JWT_COOKIE_CSRF_PROTECT = False
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    MONGO_URI = os.getenv("MONGO_URI")
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")
    AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
    AWS_REGION_NAME = os.getenv("AWS_REGION")
    EMAIL_FROM = os.getenv("EMAIL_FROM")
    FRONTEND_URL = os.getenv("FRONTEND_URL")
    DEBUG = os.getenv("DEBUG", "False") == "True"
