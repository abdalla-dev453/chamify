from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.blueprints.admin import controllers
from app.middleware.rbac import roles_required
from app.utils.responses import success_response, error_response

admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/overview", methods=["GET"])
@jwt_required()
@roles_required("system_admin")
def platform_overview():
    """
    Returns platform-wide metrics across all tenants (total groups, transaction volume).
    """
    return controllers.platform_overview()


@admin_bp.route("/kyc-queue", methods=["GET"])
@jwt_required()
@roles_required("system_admin") 
def kyc_queue():
    """
    Returns pending user identity verifications requiring system admin approval.
    """
    return controllers.kyc_queue()


@admin_bp.route("/tenants/<string:tenant_id>/suspend", methods=["POST"])
@jwt_required()
@roles_required("system_admin")
def suspend_tenant(tenant_id):
    """
    Phase 8: Freezes a tenant workspace. 
    Revokes access for all members under this tenant ID immediately.
    """
    payload = request.get_json(force=True, silent=True) or {}
    reason = payload.get("reason", "No explicit administrative reason provided.")
    
    result, status_code = controllers.suspend_tenant_workspace(tenant_id, reason)
    
    if status_code != 200:
        return error_response("Failed to process suspension request", status_code, errors=result)
        
    return success_response(result, f"Tenant workspace {tenant_id} has been suspended", 200)


@admin_bp.route("/tenants/<string:tenant_id>/activate", methods=["POST"])
@jwt_required()
@roles_required("system_admin")
def activate_tenant(tenant_id):
    """
    Phase 8: Re-enables a suspended tenant workspace.
    Restores normal platform operations for the specified group.
    """
    result, status_code = controllers.activate_tenant_workspace(tenant_id)
    
    if status_code != 200:
        return error_response("Failed to process activation request", status_code, errors=result)
        
    return success_response(result, f"Tenant workspace {tenant_id} is now fully active", 200)



@admin_bp.route("/tenants/<string:tenant_id>/domain", methods=["POST"])
@jwt_required()
@roles_required("system_admin")
def configure_tenant_domain(tenant_id):
    payload = request.get_json(force=True, silent=True) or {}

    if not payload.get("custom_domain"):
        return error_response("Missing required parameter: domain_name", 422)
    
    result, status_code = controllers.map_custom_domain_routing(tenant_id, payload)
    if status_code != 200:
        return error_response("Domain binding rejected", status_code, errors=result)
    return success_response(result, "Custom DNS domain route registered successfully", 200)
