from flask import Blueprint
from app.middleware.tenant_scope import require_tenant
from app.blueprints.ledger import controllers

ledger_bp = Blueprint("ledger", __name__)


@ledger_bp.route("/wallets/<string:wallet_id>/statement", methods=["GET"])
@require_tenant
def wallet_statement(wallet_id):
    return controllers.wallet_statement(wallet_id)

# TODO(Phase 5): POST /<entry_id>/reverse (group_admin only, via minimum_role)
