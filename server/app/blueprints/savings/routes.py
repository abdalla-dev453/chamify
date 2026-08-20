from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from app.blueprints.savings import controllers
from app.middleware.rbac import minimum_role
from app.middleware.tenant_scope import require_tenant
from app.utils.responses import error_response

savings_bp = Blueprint("savings", __name__)


@savings_bp.route("/schedules", methods=["GET"])
@require_tenant
@jwt_required()
@minimum_role("member")
def list_schedules():
    """
    Returns all standard recurring savings rules configured for this tenant workspace.
    """
    return controllers.list_schedules()


@savings_bp.route("/schedules", methods=["POST"])
@require_tenant
@jwt_required()
@minimum_role("group_admin")
def create_savings_schedule():
    """
    Phase 1: Configures a new recurring savings framework constraint
    (e.g., Weekly Contribution Requirements or Core Share Allocations).
    Restricted to group administrators.
    """
    payload = request.get_json(force=True, silent=True) or {}
    
    # Simple explicit key presence confirmation before execution handover
    required_keys = ["name", "frequency", "expected_amount"]
    missing_keys = [k for k in required_keys if k not in payload]
    
    if missing_keys:
        return error_response(
            message="Invalid schedule layout configuration definition",
            status=422,
            errors={"missing_parameters": missing_keys}
        )
        
    return controllers.create_schedule(payload)


@savings_bp.route("/contributions", methods=["POST"])
@require_tenant
@jwt_required()
@minimum_role("group_admin")
def record_manual_contribution():
    """
    Phase 1: Registers over-the-counter cash matching transactions handled directly.
    Instantiates physical audit strings and applies internal wallet modifications.
    Restricted to group management.
    """
    payload = request.get_json(force=True, silent=True) or {}
    
    required_keys = ["wallet_id", "amount"]
    missing_keys = [k for k in required_keys if k not in payload]
    
    if missing_keys:
        return error_response(
            message="Invalid transaction declaration",
            status=422,
            errors={"missing_parameters": missing_keys}
        )
        
    return controllers.record_manual_contribution(payload)
