from flask import Blueprint, request
from app.middleware.tenant_scope import require_tenant
from app.middleware.rbac import minimum_role
from app.blueprints.compliance import controllers
from app.utils.responses import error_response

compliance_bp = Blueprint("compliance", __name__)


@compliance_bp.route("/audit-log", methods=["GET"])
@require_tenant
@minimum_role("group_admin")
def list_audit_log():
    """
    Returns the recent administrative audit trails for the tenant workspace.
    """
    return controllers.list_audit_log()


@compliance_bp.route("/statements/<string:wallet_id>", methods=["POST"])
@require_tenant
@minimum_role("member")
def request_member_statement(wallet_id):
    """
    Phase 5: Triggers an asynchronous generation job for an account ledger statement.
    Accessible by standard members checking their own balances up to group administrators.
    """
    payload = request.get_json(force=True, silent=True) or {}
    
    # Inject the wallet target reference cleanly into payload arguments
    payload["wallet_id"] = wallet_id
    
    # Enforce email presence before handing task parameters down to the controller loop
    if "email" not in payload:
        return error_response(
            message="Invalid request layout",
            code=422, # type: ignore
            errors={"missing_parameters": ["email"]}
        )
        
    return controllers.request_statement(payload)


@compliance_bp.route("/reports/trial-balance", methods=["GET"])
@require_tenant
@minimum_role("group_admin")
def get_trial_balance_report():
    """
    Phase 5: Financial Health check. Confirms double-entry balancing integrity.
    Restricted strictly to management roles.
    """
    return controllers.trial_balance_report()


@compliance_bp.route("/reports/sasra-balance-sheet", methods=["GET"])
@require_tenant
@minimum_role("group_admin")
def get_sasra_balance_sheet():
    """
    Phase 5: Compiles a standardized regulatory asset/liability classification matrix 
    matching the SASRA statutory reporting requirements.
    """
    return controllers.sasra_balance_sheet()
