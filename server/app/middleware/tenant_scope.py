"""
Enforces the Section 2.2 isolation model in code: pulls tenant_id off the
JWT claims and exposes helpers so every blueprint queries scoped-to-tenant
by default, never by accident forgetting the filter.
"""
from functools import wraps
from flask_jwt_extended import get_jwt, verify_jwt_in_request
from app.utils.responses import error_response


def get_current_tenant_id():
    claims  = get_jwt()
    return claims.get("tenant_id")



def require_tenant(fn):
    """Blocks system_admin-only routes from being hit without a tenant context,
    and blocks tenant routes from being hit by a user with no tenant."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        if not get_current_tenant_id():
            return error_response(
                "You do not have permission to access to perform this action.",
                403
            )
        return fn(*args, **kwargs)
    return wrapper



def scoped_query(model):
    """Use inside any blueprint: LedgerEntry.query -> scoped_query(LedgerEntry)."""
    tenant_id = get_current_tenant_id()
    return model.query.filter_by(tenant_id=tenant_id)

