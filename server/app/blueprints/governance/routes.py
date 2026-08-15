from flask import Blueprint
from app.middleware.tenant_scope import require_tenant
from app.blueprints.governance import controllers
from app.blueprints import governance

governance_bp = Blueprint("governance", __name__)


@governance_bp.route("/welfare-requests", methods=["GET"])
@require_tenant
def list_open_requests():
    return controllers.list_welfare_requests()


@governance_bp.route("/votes", methods=["GET"])
@require_tenant
def list_open_votes():
    return controllers.list_open_votes()



# TODO(Phase 5): POST /welfare-requests, POST /votes/<topic_id>/ballots
