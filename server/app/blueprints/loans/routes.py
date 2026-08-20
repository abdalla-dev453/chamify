from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError

from app.middleware.rbac import minimum_role
from app.middleware.tenant_scope import require_tenant, get_current_tenant_id
from app.schemas.loan_schema import create_loan_schema # Adjusted based on import style
from app.utils.responses import error_response
from app.blueprints.loans import controllers

loans_bp = Blueprint("loans", __name__)


@loans_bp.route("", methods=["GET"])
@require_tenant
@jwt_required()
@minimum_role("member")
def list_loans():
    """
    Returns a multi-tenant scoped list of all active and historical loan positions.
    """
    return controllers.list_loans()


@loans_bp.route("/apply", methods=["POST"])
@require_tenant
@jwt_required()
@minimum_role("member")
def apply_for_loan():
    """
    Ingests a new credit application, validates structural parameters via Marshmallow,
    and sets up the tracking entity.
    """
    try:
        data = create_loan_schema.load(request.get_json() or {})
    except ValidationError as err:
        return error_response("Invalid input", 422, errors=err.messages)
    return controllers.apply_for_loan(data, get_current_tenant_id(), get_jwt_identity())


@loans_bp.route("/<string:loan_id>/schedule-preview", methods=["GET"])
@require_tenant
@jwt_required()
@minimum_role("member")
def schedule_preview(loan_id):
    """
    Returns an analytical preview math curve tracking future loan reducing balance metrics.
    """
    return controllers.repayment_schedule_preview(loan_id)


@loans_bp.route("/<string:loan_id>/guarantors/<string:user_id>/approve", methods=["POST"])
@require_tenant
@jwt_required()
@minimum_role("member")
def approve_loan_guarantorship(loan_id, user_id):
    """
    Phase 3: Guarantor Sign-off Endpoint.
    Allows a nominated group member to securely confirm their risk liability signature.
    Security Gate: Enforces that a voter can only sign off on their OWN user ID.
    """
    active_signer_id = get_jwt_identity()
    
    # Structural Anti-Fraud Check: Prevent identity spoofing
    if str(active_signer_id) != str(user_id):
        return error_response(
            message="Unauthorized execution request context mapping", 
            status=403, 
            errors={"identity_mismatch": "You are not authorized to sign a guarantor contract line on behalf of another user identity."}
        )
        
    return controllers.approve_guarantor(loan_id, user_id)


@loans_bp.route("/<string:loan_id>/disburse", methods=["POST"])
@require_tenant
@jwt_required()
@minimum_role("group_admin")
def trigger_loan_disbursal(loan_id):
    """
    Phase 3: Administrative Release Trigger.
    Launches the payment pipeline which pushes liquidity down to Safaricom's B2C gateways.
    Restricted strictly to group management roles.
    """
    return controllers.disburse_loan(loan_id)
