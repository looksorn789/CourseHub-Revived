# app.py
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from pymongo import MongoClient
from supabase import create_client, Client
from config import Config
from routes.auth import auth_bp
from routes.profile import profile_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app)

    jwt = JWTManager(app)

    @jwt.invalid_token_loader
    def invalid_token_callback(error_string):
        return jsonify({
            'error': 'invalid_token',
            'message': 'Invalid token'
        }), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'error': 'token_expired',
            'message': 'Token has expired'
        }), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error_string):
        return jsonify({
            'error': 'missing_token',
            'message': 'Token is required'
        }), 401

    try:
        client = MongoClient(app.config["MONGO_URI"], tls=True, tlsAllowInvalidCertificates=True)
        db = client.get_default_database()
        app.db = db
    except Exception as e:
        print(f"MongoDB connection error: {e}")
        raise

    try:
        app.supabase = create_client(app.config["SUPABASE_URL"], app.config["SUPABASE_KEY"])
    except Exception as e:
        print(f"Supabase setup error: {e}")
        raise

    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(profile_bp, url_prefix='/api')

    return app

app = create_app()

if __name__ == "__main__":
    app.run(debug=app.config["DEBUG"])