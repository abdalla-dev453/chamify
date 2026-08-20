"""SASRA-style reports, member statements, audit log queries (Section 4.4).
Phase 5 build. Statement PDF generation is dispatched to a Celery task
(app/tasks/statement_tasks.py) so the request/response cycle stays fast."""
from flask import g
from sqlalchemy import func
from app.extensions import db
from app.models.audit_log import AuditLog
from app.middleware.tenant_scope import scoped_query
from app.models.wallet import Wallet
from app.models.ledger import LedgerEntry  # Adjust import based on your exact ledger models
from app.utils.responses import success_response, error_response


def list_audit_log():
    """
    Returns platform-wide tenant logs up to a safe 200-row limit boundary
    to optimize data payload transfer sizes.
    """
    logs = scoped_query(AuditLog).order_by(AuditLog.created_at.desc()).limit(200).all()
    return success_response([
        {
            "id": l.id,
            "action": l.action, 
            "entity_type": l.entity_type, 
            "user_id": getattr(l, "user_id", None),
            "created_at": l.created_at.isoformat()
        } for l in logs
    ])


def request_statement(payload):
    """
    Phase 5: Offloads slow file assembly computations to background worker queues.
    Enqueues the asynchronous statement generator task.
    """
    # Safeguard task imports locally within the handler scope to avoid circular runtime crashes
    from app.tasks.statement_tasks import generate_statement
    
    tenant_id = g.get("tenant_id")
    wallet_id = payload.get("wallet_id")
    start_date = payload.get("start_date") # Expected in standard format: YYYY-MM-DD
    end_date = payload.get("end_date")
    destination_email = payload.get("email")

    if not wallet_id or not destination_email:
        return error_response("Missing required parameters: wallet_id and email are necessary", 422)

    # Validate target entity boundary before spawning remote jobs
    wallet = scoped_query(Wallet).filter_by(id=wallet_id).first()
    if not wallet:
        return error_response("Target wallet context mismatch or not found", 404)

    # Fire background worker task with specific criteria parameters
    generate_statement.delay(
        tenant_id=tenant_id,
        wallet_id=wallet_id,
        start_date=start_date,
        end_date=end_date,
        email=destination_email
    )

    return success_response(
        {"status": "queued", "wallet_id": wallet_id},
        message="Statement generation job successfully dispatched. File will be emailed once compiled.",
        status=202
    )


def trial_balance_report():
    """
    Phase 5: Double-Entry Ledger Mathematical Verification.
    Aggregates overall system credits and debits to confirm structural ledger equilibrium.
    """
    tenant_id = g.get("tenant_id")
    
    # Calculate global balances across entry classifications
    aggregates = db.session.query(
        LedgerEntry.entry_type,
        func.sum(LedgerEntry.amount).label("total_amount")
    ).filter(LedgerEntry.tenant_id == tenant_id).group_by(LedgerEntry.entry_type).all()

    # Normalize response structural key mappings
    balance_map = {"credit": 0.0, "debit": 0.0}
    for row in aggregates:
        if row.entry_type in balance_map:
            balance_map[row.entry_type] = float(row.total_amount or 0)

    # Perform structural balance accounting safety audit checks
    is_balanced = balance_map["credit"] == balance_map["debit"]
    discrepancy = abs(balance_map["credit"] - balance_map["debit"])

    return success_response({
        "tenant_id": tenant_id,
        "total_credits": balance_map["credit"],
        "total_debits": balance_map["debit"],
        "is_mathematically_balanced": is_balanced,
        "discrepancy_variance": discrepancy
    })


def sasra_balance_sheet():
    """
    Phase 5: SASRA-Compliant Asset and Capital Classification Report.
    Groups platform assets, loan portfolios, and members' savings into specialized ledger buckets.
    """
    tenant_id = g.get("tenant_id")

    # 1. Liquid Assets: Capital held securely in members' transactional wallets
    total_liquid_cash = db.session.query(func.sum(Wallet.balance)).filter(
        Wallet.tenant_id == tenant_id
    ).scalar() or 0

    # 2. Earning Assets: Outstanding loan capital balances currently out with members
    # (Matches ledger classification categories established inside core engines)
    total_loans_receivable = db.session.query(func.sum(LedgerEntry.amount)).filter(
        LedgerEntry.tenant_id == tenant_id,
        LedgerEntry.source_type == "loan_disbursement",
        LedgerEntry.entry_type == "debit"
    ).scalar() or 0
    
    total_loans_repaid = db.session.query(func.sum(LedgerEntry.amount)).filter(
        LedgerEntry.tenant_id == tenant_id,
        LedgerEntry.source_type == "loan_repayment",
        LedgerEntry.entry_type == "credit"
    ).scalar() or 0

    active_outstanding_loan_portfolio = max(0, float(total_loans_receivable) - float(total_loans_repaid))

    # 3. Liabilities / Institutional Capital: Aggregated member core savings balances
    total_member_savings_contributions = db.session.query(func.sum(LedgerEntry.amount)).filter(
        LedgerEntry.tenant_id == tenant_id,
        LedgerEntry.source_type == "savings_contribution",
        LedgerEntry.entry_type == "credit"
    ).scalar() or 0

    # Assemble structured statutory data payload tree matching SASRA reporting layouts
    sasra_payload = {
        "regulatory_metadata": {
            "tenant_id": tenant_id,
            "accounting_standard": "SASRA-SACCO-SOCIETIES-ACT-2010",
            "classification_basis": "Double-Entry Ledger Architecture"
        },
        "assets": {
            "cash_and_bank_balances": float(total_liquid_cash),
            "outstanding_loan_portfolio": active_outstanding_loan_portfolio,
            "total_assets": float(total_liquid_cash) + active_outstanding_loan_portfolio
        },
        "liabilities_and_shares": {
            "member_deposits_savings": float(total_member_savings_contributions),
            "retained_earnings_reserves": (float(total_liquid_cash) + active_outstanding_loan_portfolio) - float(total_member_savings_contributions)
        }
    }

    return success_response(sasra_payload)
