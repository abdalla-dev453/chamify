from flask import Blueprint, request, g
from flask_jwt_extended import jwt_required
from app.blueprints.billing import controllers
from app.middleware.rbac import roles_required  # Adjust import based on your rbac module path
from app.utils.responses import error_response, success_response

billing_bp = Blueprint("billing", __name__)


@billing_bp.route("/plans", methods=["GET"])
def list_plans():
    return controllers.list_plans()


@billing_bp.route("/subscribe", methods=["POST"])
@jwt_required()
@roles_required("tenant_admin")
def subscribe_tenant():
    """
    Phase 4: Upgrades or changes a tenant's subscription plan.
    Restricted strictly to tenant administrators. Extracts tenant_id safely 
    from request contexts or headers.
    """
    # 1. Pull the tenant id context (modify depending on how your app stores context e.g., request.headers, g, or jwt claims)
    tenant_id = request.headers.get("X-Tenant-ID") or getattr(g, "tenant_id", None)
    
    if not tenant_id:
        return error_response(
            message="Missing tracking header",
            code=400, # pyright: ignore[reportCallIssue]
            errors={"X-Tenant-ID": "A valid workspace identification context is required to register subscription changes."}
        )
        
    payload = request.get_json(force=True, silent=True) or {}
    
    # 2. Basic payload verification
    if "plan_id" not in payload:
        return error_response(
            message="Invalid subscription modification definition",
            code=422, # type: ignore
            errors={"missing_parameters": ["plan_id"]}
        )
        
    # 3. Delegate execution directly to your subscription controller engine
    return controllers.subscribe_tenant_to_plan(tenant_id, payload)
    
    # 4. Return a success response to the client
    # return success_response(result, "Tenant subscription updated successfully", 200)
    