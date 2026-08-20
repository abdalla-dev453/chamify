from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.blueprints.governance import controllers
from app.middleware.rbac import minimum_role
from app.middleware.tenant_scope import require_tenant
from app.utils.responses import error_response

governance_bp = Blueprint("governance", __name__)


@governance_bp.route("/welfare-requests", methods=["GET"])
@require_tenant
@jwt_required()
@minimum_role("member")
def list_open_requests():
    """
    Returns the history of recent welfare and benevolence requests for this tenant.
    """
    return controllers.list_welfare_requests()


@governance_bp.route("/welfare-requests", methods=["POST"])
@require_tenant
@jwt_required()
@minimum_role("member")
def submit_welfare_request():
    """
    Phase 5: Submits a new emergency or benevolent financial assistance application.
    Extracts the author's member identity cleanly from the validated JWT context.
    """
    member_id = get_jwt_identity()
    payload = request.get_json(force=True, silent=True) or {}
    
    return controllers.submit_welfare_request(member_id, payload)


@governance_bp.route("/welfare-requests/<string:request_id>/approve", methods=["POST"])
@require_tenant
@jwt_required()
@minimum_role("group_admin")
def approve_welfare_request(request_id):
    """
    Phase 5: Administrative Authorization block. Approves a pending grant request
    and programmatically commits balancing double-entry ledger rows.
    """
    reviewer_id = get_jwt_identity()
    return controllers.approve_welfare_request(request_id, reviewer_id)


@governance_bp.route("/votes", methods=["GET"])
@require_tenant
@jwt_required()
@minimum_role("member")
def list_open_votes():
    """
    Returns active resolutions currently open for member voting during the AGM.
    """
    return controllers.list_open_votes()


@governance_bp.route("/votes/<string:topic_id>/ballots", methods=["POST"])
@require_tenant
@jwt_required()
@minimum_role("member")
def cast_ballot(topic_id):
    """
    Phase 5: Casts a secure, tamper-evident vote for a specific agenda item.
    Injects topic context and delegates to the cryptographic signature calculation engine.
    """
    member_id = get_jwt_identity()
    payload = request.get_json(force=True, silent=True) or {}
    
    payload["topic_id"] = topic_id
    
    if "choice" not in payload:
        return error_response(
            message="Invalid ballot structure",
            code=422, # pyright: ignore[reportCallIssue]
            errors={"missing_parameters": ["choice"]}
        )
        
    return controllers.cast_ballot(member_id, payload)
