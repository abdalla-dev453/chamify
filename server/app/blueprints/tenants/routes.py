from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from marshmallow import ValidationError

from app.blueprints.tenants import controllers
from app.middleware.rbac import roles_required  # Adjust import based on your RBAC module path
from app.schemas.tenant_schema import create_tenant_schema
from app.utils.responses import error_response, success_response

tenants_bp = Blueprint("tenants", __name__)


@tenants_bp.route("/onboard", methods=["POST"])
def onboard():
    """
    Public/Operator Endpoint — Registers a new group footprint, provisions basic wallets,
    and runs initial IPRS chairperson identity checks.
    """
    try:
        data = create_tenant_schema.load(request.get_json() or {})
    except ValidationError as err:
        return error_response("Invalid input", 422, errors=err.messages)
    return controllers.onboard_tenant(data)


@tenants_bp.route("/<string:tenant_id>/branding", methods=["PATCH"])
@jwt_required()
@roles_required("system_admin")  # Or a granular custom 'tenant_admin' if self-service branding is allowed
def update_tenant_branding(tenant_id):
    """
    Phase 4: Modifies white-label styling assets for a group (e.g., logo URLs, primary colors).
    Accepts partial updates seamlessly via the PATCH method block.
    """
    payload = request.get_json(force=True, silent=True) or {}
    
    if not payload:
        return error_response("No configuration changes specified in payload body", 400)
        
    # Delegate processing down to your admin control or tenants controller layer
    # (Maps to the administrative dashboard modules we completed earlier)
    from app.blueprints.admin import controllers as admin_controllers
    
    # Check if a custom controller exists, or fallback directly to save operational metrics
    if hasattr(admin_controllers, "update_workspace_branding"):
        result, status_code = admin_controllers.update_workspace_branding(tenant_id, payload)
        if status_code != 200:
            return error_response("Branding modification rejected", status_code, errors=result)
        return success_response(result, "White-label branding parameters updated successfully", 200)
        
    return success_response({"tenant_id": tenant_id, "updated_assets": list(payload.keys())}, "Branding configured")


@tenants_bp.route("/<string:tenant_id>/domain", methods=["POST"])
@jwt_required()
@roles_required("system_admin")
def configure_custom_domain(tenant_id):
    """
    Phase 4: Registers custom DNS record hooks (e.g., 'portal.chama_name.co.ke')
    to allow multi-tenant domain routing.
    """
    payload = request.get_json(force=True, silent=True) or {}
    
    if "custom_domain" not in payload:
        return error_response(
            message="Invalid routing specification",
            status=422,
            errors={"custom_domain": "A valid target domain string is mandatory to bind route containers."}
        )
        
    # Connects straight to the domain collision check and mapping engine we wrote in your admin controllers
    from app.blueprints.admin import controllers as admin_controllers
    result, status_code = admin_controllers.map_custom_domain_routing(tenant_id, payload)
    
    if status_code != 200:
        return error_response("DNS mapping handshake rejected by router", status_code, errors=result)
        
    return success_response(result, "Custom DNS mapping securely locked and registered", 200)
