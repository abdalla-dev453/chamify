from flask import Blueprint
from app.blueprints.billing import controllers

billing_bp = Blueprint("billing", __name__)


@billing_bp.route("/plans", methods=["GET"])
def list_plans():
    return controllers.list_plans()

# TODO(Phase 4): POST /subscribe (tenant admin only)
