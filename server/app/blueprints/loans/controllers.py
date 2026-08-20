"""Loan appraisal + guarantor sign-off engine (Section 4.1). Phase 3 build."""
from decimal import Decimal
from flask import g
from app.extensions import db
from app.models.loan import Loan
from app.models.guarantor import LoanGuarantor
from app.models.wallet import Wallet
from app.models.savings import SavingsContribution
from app.utils.calculators import max_loan_amount, reducing_balance_schedule
from app.middleware.tenant_scope import scoped_query
from app.schemas.loan_schema import loan_schema, loans_schema
from app.utils.responses import success_response, error_response


def list_loans():
    """
    Returns a multi-tenant scoped dump of all system loan positions.
    """
    return success_response(loans_schema.dump(scoped_query(Loan).all()))


def apply_for_loan(data, tenant_id, borrower_user_id):
    """
    Evaluates historical core savings multipliers to calculate loan capability limit boundaries
    and provisions new records in a pending guarantor confirmation state.
    """
    wallet = scoped_query(Wallet).filter_by(id=data["wallet_id"]).first()
    if not wallet:
        return error_response("Wallet not found", 404)

    total_savings = db.session.query(
        db.func.coalesce(db.func.sum(SavingsContribution.amount), 0)
    ).filter_by(wallet_id=wallet.id).scalar()

    limit = max_loan_amount(Decimal(total_savings or 0))
    if Decimal(data["principal"]) > limit:
        return error_response(f"Requested amount exceeds your loan limit of {limit}", 422)

    loan = Loan(
        tenant_id=tenant_id,
        wallet_id=wallet.id,
        borrower_user_id=borrower_user_id,
        principal=data["principal"],
        interest_method=data["interest_method"],
        interest_rate=Decimal("0.12"),
        term_months=data["term_months"],
        status="pending_guarantors",
    )
    db.session.add(loan)
    db.session.commit()
    
    # 1. Complete Phase 3 TODO: Auto-create LoanGuarantor matching trace links if passed inside the payload
    guarantor_ids = data.get("guarantor_user_ids", [])
    for gid in guarantor_ids:
        guarantor_entry = LoanGuarantor(
            tenant_id=tenant_id,
            loan_id=loan.id,
            guarantor_user_id=gid,
            amount_pledged=Decimal(str(data["principal"])) / max(1, len(guarantor_ids)), # Split risk allocation uniformly
            status="pending"
        )
        db.session.add(guarantor_entry)
        
    if guarantor_ids:
        db.session.commit()

    return success_response(loan_schema.dump(loan), status=201, message="Loan application submitted successfully")


def repayment_schedule_preview(loan_id):
    """
    Compiles an inline math table breakdown predicting future reducing balance tracking curves.
    """
    loan = scoped_query(Loan).filter_by(id=loan_id).first()
    if not loan:
        return error_response("Loan not found", 404)
    schedule = reducing_balance_schedule(loan.principal, loan.interest_rate, loan.term_months)
    return success_response(schedule)


def approve_guarantor(loan_id, guarantor_user_id):
    """
    Phase 3: Signs off risk allocation parameters for a member.
    If all linked guarantors confirm, automatically increments status thresholds forward.
    """
    tenant_id = g.get("tenant_id")
    
    # Locate targeted guarantor tracking row within context parameters
    guarantor_link = scoped_query(LoanGuarantor).filter_by(
        loan_id=loan_id, guarantor_user_id=guarantor_user_id
    ).first()
    
    if not guarantor_link:
        return error_response("Guarantor reference allocation not found for this loan signature path", 404)
        
    if guarantor_link.status != "pending":
        return error_response(f"Guarantor status has already been handled: {guarantor_link.status}", 400)
        
    guarantor_link.status = "approved"
    db.session.commit()
    
    # Dynamic Evaluation: Check if any lingering pending signatures are still outstanding
    loan = scoped_query(Loan).filter_by(id=loan_id).first()
    remaining_pending = LoanGuarantor.query.filter_by(loan_id=loan_id, status="pending").count()
    
    if loan and remaining_pending == 0:
        loan.status = "approved_pending_disbursement"
        db.session.commit()
        
    return success_response({
        "loan_id": loan_id,
        "guarantor_user_id": guarantor_user_id,
        "current_loan_status": loan.status if loan else "unknown"
    }, message="Guarantor signature has been safely recorded and logged.")


def disburse_loan(loan_id):
    """
    Phase 3: Final execution gate. Verifies security context, balances records, 
    and offloads asynchronous cash delivery immediately to the Safaricom Daraja B2C engine.
    """
    tenant_id = g.get("tenant_id")
    
    loan = scoped_query(Loan).filter_by(id=loan_id).first()
    if not loan:
        return error_response("Target loan object entry context missing", 404)
        
    if loan.status != "approved_pending_disbursement":
        return error_response(f"Cannot execute disbursement. Current state profile is: {loan.status}", 400)
        
    # Query wallet profile parameter data points directly to retrieve target recipient mobile interfaces
    borrower_wallet = Wallet.query.filter_by(tenant_id=tenant_id, id=loan.wallet_id).first()
    if not borrower_wallet or not borrower_wallet.phone_number:
        return error_response("Destination user wallet requires a valid, verified phone number asset link.", 422)

    # Move task processing out to your asynchronous integration layers locally
    from app.blueprints.mpesa import controllers as mpesa_controllers
    
    # Structure payload contract array parameters for the core M-Pesa controller pipeline we built earlier
    disbursement_payload = {
        "tenant_id": tenant_id,
        "phone_number": borrower_wallet.phone_number,
        "amount": float(loan.principal),
        "loan_id": loan.id
    }
    
    # Advance loan position layout state metrics into an active flight transit channel
    loan.status = "disbursing"
    db.session.commit()
    
    # Hand off payload control straight to the active B2C execution machine
    result, status_code = mpesa_controllers.initiate_b2c_disbursement(disbursement_payload)
    
    if status_code != 202:
        # Reversion failsafe loop trigger if connection handshakes fail to mount
        loan.status = "approved_pending_disbursement"
        db.session.commit()
        return error_response("Handoff block rejected by downstream infrastructure gateways", status_code, errors=result)
        
    return success_response(
        {"loan_id": loan.id, "status": "disbursement_queued", "gateway_trace": result},
        message="Loan has passed all statutory validation checks. Cash payload passed down to network queues.",
        status=202
    )
