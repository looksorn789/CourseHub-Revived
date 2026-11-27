import logging
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from jwt import PyJWKClient
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from supabase import create_client, Client
from config import Config
from routes.auth import auth_bp
from routes.forum import forum_bp
from routes.post import post_bp
from routes.comments import comment_bp
from routes.profile import profile_bp
from routes.friend_request import friend_request_bp
from routes.friends import friends_bp
from routes.search import search_bp
from routes.messages import messages_bp
from chat_socket import init_realtime, socketio


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class _ClosedWebSocketFilter(logging.Filter):
    """Hide the dev server's noise when a chat WebSocket closes.

    With Flask's development server, every WebSocket that ends (page reload,
    tab closed, sign-out) is logged as a failed
    "GET /socket.io/?EIO=4&transport=websocket" (400/500, plus a
    ConnectionError traceback in debug). The connection itself worked; real
    handshake rejections (e.g. a bad origin) still show because they carry a
    reason and happen before the upgrade. Production servers don't do this.
    """

    def filter(self, record):
        if record.exc_info and record.exc_info[0] is ConnectionError:
            return False
        message = record.getMessage()
        # Debug server logs the traceback as text ("Error on request: ...").
        if "_websocket_wsgi" in message and "ConnectionError" in message:
            return False
        if "/socket.io/?EIO=4&transport=websocket HTTP/1.1" in message and (
            '" 400 -' in message or '" 500 -' in message
        ):
            return False
        return True


logging.getLogger("werkzeug").addFilter(_ClosedWebSocketFilter())


def setup_jwt(app):
    jwt = JWTManager(app)

    # Public keys Supabase signs user tokens with (cached by PyJWKClient).
    jwks_client = PyJWKClient(
        f"{app.config['SUPABASE_URL']}/auth/v1/.well-known/jwks.json",
        cache_keys=True,
        lifespan=3600,
    )

    @jwt.decode_key_loader
    def decode_key_callback(jwt_header, jwt_payload):  # pylint: disable=unused-argument
        # HS256 must only ever be checked against the shared secret, and
        # asymmetric tokens only against Supabase's published public keys.
        if jwt_header.get("alg") == "HS256":
            return app.config["JWT_SECRET_KEY"]
        return jwks_client.get_signing_key(jwt_header.get("kid")).key

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
    app.register_blueprint(friend_request_bp, url_prefix='/api/friend-request')
    app.register_blueprint(friends_bp, url_prefix='/api')
    app.register_blueprint(search_bp, url_prefix='/api/search')
    app.register_blueprint(messages_bp, url_prefix='/api/messages')
    init_realtime(app)


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
    # socketio.run serves both the REST API and the chat WebSocket.
    socketio.run(
        app,
        host="127.0.0.1",
        port=5000,
        debug=app.config["DEBUG"],
        # JSON API: the interactive HTML debugger adds nothing and prints raw
        # tracebacks for every closed chat socket; errors still get logged.
        use_debugger=False,
        allow_unsafe_werkzeug=app.config["DEBUG"],  # dev server only
    )
