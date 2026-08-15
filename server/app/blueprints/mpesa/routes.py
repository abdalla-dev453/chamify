from flask import Blueprint, request
from app.middleware.rate_limit import limiter, webhook_rate_limit
from app.blueprints.mpesa import controllers

mpesa_bp = Blueprint("mpesa", __name__)


@mpesa_bp.route("/callback/<string:tenant_id>", methods=["POST"])
@limiter.limit(webhook_rate_limit)
def c2b_callback(tenant_id):
    """
    Public webhook — Daraja calls this directly, so it's NOT behind @require_tenant.
    Validate the payload shape carefully; never trust it blindly in production
    (verify source IP / use a shared secret path segment at minimum).
    """
    payload = request.get_json(force=True, silent=True) or {}
    return controllers.handle_c2b_callback(tenant_id, payload)

# TODO(Phase 2): POST /disburse (internal, triggered by loans/controllers.disburse_loan)
