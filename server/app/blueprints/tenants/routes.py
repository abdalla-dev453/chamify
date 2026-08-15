from flask import Blueprint, request
from marshmallow import ValidationError
from app.schemas.tenant_schema import create_tenant_schema
from app.utils.responses import error_response
from app.blueprints.tenants import controllers

tenants_bp = Blueprint("tenants", __name__)


@tenants_bp.route("/onboard", methods=["POST"])
def onboard():
    try:
        data = create_tenant_schema.load(request.get_json() or {})
    except ValidationError as err:
        return error_response("Invalid input", 422, errors=err.messages)
    return controllers.onboard_tenant(data)

# TODO(Phase 4): PATCH /<tenant_id>/branding, POST /<tenant_id>/domain
