"""
Role-based access control decorator, enforcing the RBAC hierarchy from
Section 4.3 at the API layer via Flask-JWT-Extended claims.
"""

from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from app.utils.responses import error_response


ROLE_RANKS = {
    "member": 0,
    "treasurer": 1,
    "branch_leader": 2,
    "group_admin": 3,
    "system_admin": 4
}


def roles_required(*allowed_roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            role = claims.get("role")
            if role not in allowed_roles:
                return error_response(
                    "You do not have permission to access to perform this action.",
                    403
                )
            return fn(*args, **kwargs)
        return wrapper
    return decorator



def minimum_role(role_name):
    """Use when 'this role and anything above it' is the intent.
    e.g. minimum_role('treasurer) admits treasurer, branch-leader, group-admin, system-admin"""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            role = claims.get("role")
            if ROLE_RANKS.get(role, 0) < ROLE_RANKS.get(role_name, 99):
                return error_response(
                    "You do not have permission to access to perform this action.",
                    403
                )
            return fn(*args, **kwargs)
        return wrapper
    return decorator