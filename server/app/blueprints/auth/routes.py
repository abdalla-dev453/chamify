"""
Thin HTTP layer: validate input via marshmallow, delegate to controllers.py.
"""
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from marshmallow import ValidationError

from app.schemas.user_schema import register_schema, login_schema
from app.middleware.rate_limit import limiter, auth_rate_limit, otp_rate_limit
from app.utils.responses import error_response
from app.blueprints.auth import controllers


auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
@limiter.limit(auth_rate_limit)
def register():
    try:
        data = register_schema.load(request.get_json() or {})
    except ValidationError as err:
        return error_response("Invalid input", 422, errors=err.messages)
    return controllers.register_user(data)



@auth_bp.route("/login", methods=["POST"])
@limiter.limit(auth_rate_limit)
def login():
    try:
        data = login_schema.load(request.get_json() or {})
    except ValidationError as err:
        return error_response("Invalid input", 422, errors=err.messages)
    return controllers.login_user(data)


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
@limiter.limit(auth_rate_limit)
def refresh():
    claims = get_jwt()
    identity = get_jwt_identity()
    forwarded_claims = {
        "role": claims.get("role"),
        "tenant_id": claims.get("tenant_id"),
        "full_name": claims.get("full_name")
    }
    return controllers.refresh_access_token(identity, forwarded_claims)



@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    from app.models.user import User
    user  = User.query.get(get_jwt_identity())
    if not user:
        return error_response("User not found", 404)
    from app.schemas.user_schema import user_schema
    from app.utils.responses import success_response
    return success_response(user_schema.dump(user))