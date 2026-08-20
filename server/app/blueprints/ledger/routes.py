from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.blueprints.ledger import controllers
from app.middleware.rbac import minimum_role
from app.middleware.tenant_scope import require_tenant
from app.utils.responses import error_response

ledger_bp = Blueprint("ledger", __name__)


@ledger_bp.route("/wallets/<string:wallet_id>/statement", methods=["GET"])
@require_tenant
@jwt_required()
@minimum_role("member")
def wallet_statement(wallet_id):
    """
    Returns a synchronized breakdown of localized transactional journal rows 
    for a single target wallet resource container.
    """
    return controllers.wallet_statement(wallet_id)


@ledger_bp.route("/<string:entry_id>/reverse", methods=["POST"])
@require_tenant
@jwt_required()
@minimum_role("group_admin")
def reverse_ledger_entry(entry_id):
    """
    Phase 5: Financial Reversal Mechanism.
    Instantiates an equal and opposite balancing journal line item to correct errors.
    Immutable records are preserved; rows are never deleted or rewritten.
    """
    admin_id = get_jwt_identity()
    payload = request.get_json(force=True, silent=True) or {}
    
    # Capture an administrative reason to fulfill legal audit logging requirements
    reason = payload.get("reason")
    if not reason:
        return error_response(
            message="Invalid reversal specification",
            status=422,
            errors={"reason": "An explicit reason is required to execute a double-entry journal reversal row correction."}
        )
        
    return controllers.reverse_entry(entry_id, admin_id, reason)
