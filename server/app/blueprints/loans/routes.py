from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity
from marshmallow import ValidationError

from app.middleware.tenant_scope import require_tenant, get_current_tenant_id
from app.schemas.loan_schema import create_loan_schema
from app.utils.responses import error_response
from app.blueprints.loans import controllers

loans_bp = Blueprint("loans", __name__)


@loans_bp.route("", methods=["GET"])
@require_tenant
def list_loans():
    return controllers.list_loans()


@loans_bp.route("/apply", methods=["POST"])
@require_tenant
def apply_for_loan():
    try:
        data = create_loan_schema.load(request.get_json() or {})
    except ValidationError as err:
        return error_response("Invalid input", 422, errors=err.messages)
    return controllers.apply_for_loan(data, get_current_tenant_id(), get_jwt_identity())


@loans_bp.route("/<string:loan_id>/schedule-preview", methods=["GET"])
@require_tenant
def schedule_preview(loan_id):
    return controllers.repayment_schedule_preview(loan_id)

# TODO(Phase 3): POST /<loan_id>/guarantors/<user_id>/approve, POST /<loan_id>/disburse