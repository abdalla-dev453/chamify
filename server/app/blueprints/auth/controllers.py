"""
Business logic for auth, kept separate from routes.py so routes stay thin
(parse request -> call controller -> return response) and the logic here
is unit-testable without spinning up the Flask test client.
"""
from datetime import datetime
from flask_jwt_extended import create_access_token, create_refresh_token


from app.extensions import db
from app.models.user import User
from app.models.tenant import Tenant
from app.models.wallet import Wallet
from app.utils.validators import normalize_kenyan_phone
from app.utils.responses import success_response, error_response



def _claims_for(user: User):
    return {
        "role": user.role,
        "tenant": user.tenant.slug,
        "full_name": user.full_name
    }


def register_user(data):
    tenant = Tenant.query.filter_by(slug=data["tenant_slug"]).first()
    if not tenant:
        return error_response("Unknown tenant", 404)

    phone = normalize_kenyan_phone(data["phone_number"])
    if User.query.filter_by(tenant_id=tenant.id, phone_number=phone).first():
        return error_response("A member with this phone number already exists", 409)


    user = User(
        tenant_id=tenant.id,
        full_name=data["full_name"],
        phone_number=phone,
        email=data.get("email"),
        role="member",
    )
    user.set_password(data["password"])
    db.session.add(user)
    db.session.flush() # get user.id b4 creating the wallet


    # Every memeber gets a personal wallet at signup
    wallet = Wallet(tenant_id=tenant.id, owner_user_id=user.id, wallet_type="member", name=f"{user.full_name}'s wallet")
    db.session.add(wallet)
    db.session.commit()


    access_token = create_access_token(identity=user.id, additional_claims=_claims_for(user))
    refresh_token = create_refresh_token(identity=user.id, additional_claims=_claims_for(user))


    return success_response(
        {
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "role": user.role,
            },
            "access_token": access_token,
            "refresh_token": refresh_token,
        },
        message="Account created successfully",
        status=201
    )


def login_user(data):
    tenant = Tenant.query.filter_by(slug=data["tenant_slug"]).first()
    if not tenant:
        return error_response("Unknown tenant", 404)

    phone = normalize_kenyan_phone(data["phone_number"])
    user = User.query.filter_by(tenant_id=tenant.id, phone_number=phone).first()

    if not user or not user.check_password(data["password"]):
        return error_response("Invalid phone number or password", 401)
    if not user.is_active:
        return error_response("This account has been deacivated", 403)

    access_token = create_access_token(identity=user.id, additional_claims=_claims_for(user))
    refresh_token = create_refresh_token(identity=user.id, additional_claims=_claims_for(user))

    return success_response(
        {
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "role": user.role,
            },
            "access_token": access_token,
            "refresh_token": refresh_token,
        },
        message="Logged in successful",
        status=200
    )


def refresh_access_token(user_id, claims):
    access_token = create_access_token(identity=user_id, additional_claims=claims)
    return success_response({"access_token": access_token}, message="   Token refreshed", status=200)