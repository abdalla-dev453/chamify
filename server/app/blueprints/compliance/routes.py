from flask import Blueprint
from app.middleware.tenant_scope import require_tenant
from app.middleware.rbac import minimum_role
from app.blueprints.compliance import controllers

compliance_bp = Blueprint("compliance", __name__)


@compliance_bp.route("/audit-log", methods=["GET"])
@require_tenant
@minimum_role("group_admin")
def list_audit_log():
    return controllers.list_audit_log()

# TODO(Phase 5): GET /statements/<wallet_id>, GET /reports/trial-balance
