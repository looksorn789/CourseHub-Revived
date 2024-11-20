import logging
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from supabase import create_client, Client
from config import Config
from routes.auth import auth_bp
from routes.forum import forum_bp
from routes.post import post_bp
from routes.comments import comment_bp
from routes.reply import reply_bp
from routes.profile import profile_bp

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def setup_jwt(app):
    jwt = JWTManager(app)

    @jwt.expired_token_loader
    def expired_token_callback(
        jwt_header, jwt_payload
    ):  # pylint: disable=unused-argument
        return (
            jsonify({"error": "token_expired", "message": "The token has expired"}),
            401,
        )

    @jwt.invalid_token_loader
    def invalid_token_callback(error_string):  # pylint: disable=unused-argument
        return jsonify({"error": "invalid_token", "message": "Invalid token"}), 422

    @jwt.unauthorized_loader
    def missing_token_callback(error_string):  # pylint: disable=unused-argument
        return (
            jsonify(
                {"error": "missing_token", "message": "Authentication token is missing"}
            ),
            401,
        )

    return jwt


def setup_mongodb(app):
    try:
        client = MongoClient(
            app.config["MONGO_URI"],
            tls=True,
            tlsAllowInvalidCertificates=True,
            serverSelectionTimeoutMS=5000,
        )
        client.server_info()
        db = client.get_default_database()
        app.db = db
        logger.info("MongoDB connection established successfully")
    except ConnectionFailure as e:
        logger.error(f"MongoDB connection error: {e}")
        raise
    except Exception as e:
        logger.error(f"Error setting up MongoDB: {e}")
        raise


def setup_supabase(app):
    try:
        supabase: Client = create_client(
            app.config["SUPABASE_URL"], app.config["SUPABASE_KEY"]
        )
        app.supabase = supabase
        logger.info("Supabase client initialized successfully")
    except Exception as e:
        logger.error(f"Error setting up Supabase: {e}")
        raise


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    setup_jwt(app)
    setup_mongodb(app)
    setup_supabase(app)

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(forum_bp, url_prefix="/api/forums")
    app.register_blueprint(profile_bp, url_prefix="/api/profile")
    app.register_blueprint(post_bp, url_prefix="/api/posts")
    app.register_blueprint(comment_bp, url_prefix='/api/comments')
    app.register_blueprint(reply_bp, url_prefix='/api/replies')


    @app.errorhandler(404)
    def not_found_error(error):  # pylint: disable=unused-argument
        return jsonify({"error": "not_found", "message": "Resource not found"}), 404

    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal server error: {error}")
        return (
            jsonify(
                {
                    "error": "internal_server_error",
                    "message": "An internal server error occurred",
                }
            ),
            500,
        )

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=app.config["DEBUG"])
