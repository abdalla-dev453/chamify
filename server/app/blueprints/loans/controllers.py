"""Loan appraisal + guarantor sign-off engine (Section 4.1). Phase 3 build."""
from decimal import Decimal
from app.extensions import db
from app.models.loan import Loan
from app.models.wallet import Wallet
from app.models.savings import SavingsContribution
from app.utils.calculators import max_loan_amount, reducing_balance_schedule
from app.middleware.tenant_scope import scoped_query
from app.schemas.loan_schema import loan_schema, loans_schema
from app.utils.responses import success_response, error_response


def list_loans():
    return success_response(loans_schema.dump(scoped_query(Loan).all()))


def apply_for_loan(data, tenant_id, borrower_user_id):
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
    # TODO(Phase 3): auto-create LoanGuarantor rows once guarantors are selected in the UI
    return success_response(loan_schema.dump(loan), status=201, message="Loan application submitted")


def repayment_schedule_preview(loan_id):
    loan = scoped_query(Loan).filter_by(id=loan_id).first()
    if not loan:
        return error_response("Loan not found", 404)
    schedule = reducing_balance_schedule(loan.principal, loan.interest_rate, loan.term_months)
    return success_response(schedule)

# TODO(Phase 3): approve_guarantor(), disburse_loan() -> triggers mpesa B2C via services/daraja_service.py