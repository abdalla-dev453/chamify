from flask import Blueprint, request
from marshmallow import ValidationError, Schema, fields, validate

from app.middleware.tenant_scope import require_tenant, get_current_tenant_id
from app.middleware.rbac import minimum_role
from app.utils.responses import error_response
from app.blueprints.wallets import controllers

wallets_bp = Blueprint("wallets", __name__)


class CreateSubWalletSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=2, max=150))
    sub_purpose = fields.String(required=True, validate=validate.OneOf(
        ["land", "welfare", "project", "emergency", "other"]
    ))


create_sub_wallet_schema = CreateSubWalletSchema()


@wallets_bp.route("", methods=["GET"])
@require_tenant
def list_wallets():
    return controllers.list_wallets()


@wallets_bp.route("/<string:wallet_id>", methods=["GET"])
@require_tenant
def get_wallet(wallet_id):
    return controllers.get_wallet(wallet_id)


@wallets_bp.route("/sub-wallets", methods=["POST"])
@require_tenant
@minimum_role("treasurer")
def create_sub_wallet():
    try:
        data = create_sub_wallet_schema.load(request.get_json() or {})
    except ValidationError as err:
        return error_response("Invalid input", 422, errors=err.messages)
    return controllers.create_sub_wallet(data, get_current_tenant_id())


@wallets_bp.route("/<string:wallet_id>/statement", methods=["GET"])
@require_tenant
@minimum_role("member")
def wallet_statement(wallet_id):
    return controllers.wallet_statement(wallet_id)



@wallets_bp.route("/<string:wallet_id>/statement", methods=["POST"])
@require_tenant
@minimum_role("member")
def request_wallet_statement(wallet_id):
    return controllers.request_statement(wallet_id)