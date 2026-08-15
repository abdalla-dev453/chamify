from flask import Blueprint
from app.middleware.tenant_scope import require_tenant
from app.blueprints.savings import controllers

savings_bp = Blueprint("savings", __name__)


@savings_bp.route("/schedules", methods=["GET"])
@require_tenant
def list_schedules():
    return controllers.list_schedules()

# TODO(Phase 1): POST /schedules, POST /contributions
