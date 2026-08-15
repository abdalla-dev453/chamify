from flask import Blueprint, request
from marshmallow import Schema, fields, validate, ValidationError
from app.middleware.tenant_scope import require_tenant, get_current_tenant_id
from app.middleware.rbac import minimum_role
from app.utils.responses import error_response
from app.blueprints.comms import controllers

comms_bp = Blueprint("comms", __name__)


class SendAlertSchema(Schema):
    channel = fields.String(required=True, validate=validate.OneOf(["sms", "whatsapp", "email"]))
    to = fields.String(required=True)
    message = fields.String(required=True, validate=validate.Length(max=500))


@comms_bp.route("/test-alert", methods=["POST"])
@require_tenant
@minimum_role("group_admin")
def send_test_alert():
    try:
        data = SendAlertSchema().load(request.get_json() or {})
    except ValidationError as err:
        return error_response("Invalid input", 422, errors=err.messages)
    return controllers.send_test_alert(get_current_tenant_id(), **data)