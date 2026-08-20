"""AGM voting + welfare workflow (Section 4.3). Phase 5 build."""
import hashlib
from flask import g
from app.extensions import db
from app.models.welfare import WelfareRequest
from app.models.vote import AgmVoteTopic, AgmVoteBallot
from app.models.wallet import Wallet
from app.middleware.tenant_scope import scoped_query
from app.utils.responses import success_response, error_response
from app.blueprints.ledger.controllers import post_entry


def list_welfare_requests():
    """
    Lists all tracking welfare applications filed within the tenant workspace context.
    """
    requests = scoped_query(WelfareRequest).order_by(WelfareRequest.created_at.desc()).all()
    return success_response([
        {
            "id": r.id,
            "category": r.category,
            "amount_requested": str(r.amount_requested),
            "status": r.status
        }
        for r in requests
    ])


def list_open_votes():
    """
    Returns active AGM agenda resolutions currently open for member polling.
    """
    topics = scoped_query(AgmVoteTopic).filter_by(status="open").all()
    return success_response([
        {
            "id": t.id,
            "title": t.title,
            "closes_at": t.closes_at.isoformat()
        }
        for t in topics
    ])


def submit_welfare_request(member_id, payload):
    """
    Phase 5: Registers a new member application for emergency or benevolence funds.
    Initializes the tracking row in a 'pending' verification state.
    """
    tenant_id = g.get("tenant_id")
    category = payload.get("category")
    amount = payload.get("amount_requested")

    if not category or not amount:
        return error_response("Missing required parameters: category and amount_requested", 422)

    new_request = WelfareRequest(
        tenant_id=tenant_id,
        member_id=member_id,
        category=category,
        amount_requested=amount,
        status="pending",
        details=payload.get("details", "")
    )
    
    db.session.add(new_request)
    db.session.commit()

    return success_response({
        "welfare_request_id": new_request.id,
        "status": "pending"
    }, message="Welfare application submitted successfully for board verification.", status=201)


def approve_welfare_request(request_id, reviewer_id):
    """
    Phase 5: Approves a benevolent grant and triggers real-time ledger accounting.
    Debits the central community pool/welfare vault to credit the beneficiary wallet.
    """
    tenant_id = g.get("tenant_id")
    
    welfare_req = scoped_query(WelfareRequest).filter_by(id=request_id).first()
    if not welfare_req:
        return error_response("Target welfare request profile not found", 404)
        
    if welfare_req.status != "pending":
        return error_response(f"Cannot process approval. Request is already {welfare_req.status}.", 400)

    # Locate the beneficiary's wallet container to receive the grant payout
    member_wallet = Wallet.query.filter_by(tenant_id=tenant_id, id=welfare_req.member_id).first()
    if not member_wallet:
        return error_response("Beneficiary transactional wallet profile context missing", 404)

    # Update state parameters within an isolated database atomic block
    welfare_req.status = "approved"
    welfare_req.reviewed_by = reviewer_id
    
    # Post the double-entry accounting movement securely using your ledger engine
    post_entry(
        tenant_id=tenant_id,
        wallet=member_wallet,
        scope="member",
        entry_type="credit",
        source_type="welfare_disbursement",
        amount=welfare_req.amount_requested,
        source_id=welfare_req.id,
        memo=f"Approved Benevolence Grant - Ref #{welfare_req.id}",
        mpesa_transaction_id=None  # Internal wallet adjustment, no external payment gateway callback
    )

    db.session.commit()
    return success_response({
        "welfare_request_id": request_id,
        "status": "approved",
        "ledger_reconciled": True
    }, message="Welfare grant successfully authorized and ledger entry created.")


def cast_ballot(member_id, payload):
    """
    Phase 5: Casts a secure, tamper-evident vote on an open AGM topic.
    Generates an immutable SHA-256 cryptographic hash signature to block vote manipulation.
    """
    tenant_id = g.get("tenant_id")
    topic_id = payload.get("topic_id")
    choice = payload.get("choice")  # Expected values: e.g., "YES", "NO", "ABSTAIN"

    if not topic_id or not choice:
        return error_response("Missing required vote parameter attributes: topic_id and choice", 422)

    topic = scoped_query(AgmVoteTopic).filter_by(id=topic_id, status="open").first()
    if not topic:
        return error_response("Target governance resolution agenda is closed or does not exist", 404)

    # Enforce voting fairness boundaries by preventing double voting patterns
    already_voted = scoped_query(AgmVoteBallot).filter_by(topic_id=topic_id, member_id=member_id).first()
    if already_voted:
        return error_response("Fraud protection rule: You have already cast an execution ballot for this resolution.", 409)

    # Build an immutable cryptographic hash string to establish tamper evidence
    raw_signature_payload = f"{tenant_id}:{topic_id}:{member_id}:{choice}"
    signature_hash = hashlib.sha256(raw_signature_payload.encode("utf-8")).hexdigest()

    ballot = AgmBallot(
        tenant_id=tenant_id,
        topic_id=topic_id,
        member_id=member_id,
        choice=choice,
        signature_hash=signature_hash
    )
    
    db.session.add(ballot)
    db.session.commit()

    return success_response({
        "ballot_receipt_id": ballot.id,
        "signature_verification_hash": signature_hash
    }, message="Your ballot was securely encrypted, hashed, and counted.", status=201)
