"""Savings schedules + contributions (Section 4.1). Phase 1/2 build."""
from decimal import Decimal
from flask import g
from app.extensions import db
from app.models.savings import SavingsSchedule, SavingsContribution
from app.models.wallet import Wallet
from app.middleware.tenant_scope import scoped_query
from app.utils.responses import success_response, error_response
from app.blueprints.ledger.controllers import post_entry


def list_schedules():
    """
    Lists all available savings schedule frameworks configured for the tenant.
    """
    schedules = scoped_query(SavingsSchedule).all()
    return success_response([
        {"id": s.id, "name": s.name, "frequency": s.frequency, "expected_amount": str(s.expected_amount)}
        for s in schedules
    ])


def create_schedule(payload):
    """
    Phase 1: Configures a new recurring group savings goal/target requirement
    (e.g., Weekly Welfare Contribution, Monthly Core Shares).
    """
    tenant_id = g.get("tenant_id")
    name = payload.get("name")
    frequency = payload.get("frequency") # e.g., "weekly", "monthly"
    expected_amount = payload.get("expected_amount")

    if not name or not frequency or not expected_amount:
        return error_response("Missing structural parameters: name, frequency, and expected_amount are required", 422)

    schedule = SavingsSchedule(
        tenant_id=tenant_id,
        name=name,
        frequency=frequency,
        expected_amount=Decimal(str(expected_amount))
    )
    db.session.add(schedule)
    db.session.commit()

    return success_response(
        {"schedule_id": schedule.id, "name": schedule.name},
        message="Savings obligation framework successfully registered",
        status=201
    )


def record_manual_contribution(payload):
    """
    Phase 1: Logs over-the-counter cash or bank deposits handled directly at the office.
    Immediately increments member ledger states inside an atomic commit block.
    """
    tenant_id = g.get("tenant_id")
    wallet_id = payload.get("wallet_id")
    schedule_id = payload.get("schedule_id")
    amount = payload.get("amount")

    if not wallet_id or not amount:
        return error_response("Missing tracking properties: wallet_id and amount are required", 422)

    wallet = scoped_query(Wallet).filter_by(id=wallet_id).first()
    if not wallet:
        return error_response("Target member wallet boundary context missing", 404)

    # 1. Instantiate the structured contribution record line item
    contribution = SavingsContribution(
        tenant_id=tenant_id,
        wallet_id=wallet_id,
        savings_schedule_id=schedule_id,
        amount=Decimal(str(amount)),
        payment_channel="cash_deposit",
        status="completed",
        notes=payload.get("notes", "Manual back-office cash entry")
    )
    db.session.add(contribution)
    db.session.commit()

    # 2. Securely increment the double-entry accounting ledger via your core controller
    post_entry(
        tenant_id=tenant_id,
        wallet=wallet,
        scope="member",
        entry_type="credit",
        source_type="savings_contribution",
        amount=Decimal(str(amount)),
        source_id=contribution.id,
        memo=f"Manual Contribution Match - Ref #{contribution.id}",
        mpesa_transaction_id=None
    )

    return success_response(
        {"contribution_id": contribution.id, "posted_status": "reconciled"},
        message="Manual ledger adjustments successfully committed.",
        status=201
    )


def record_mpesa_contribution(tenant_id, wallet_id, amount, mpesa_transaction_id, schedule_id=None):
    """
    Phase 2: Automated Bridge. Invoked strictly from mpesa/controllers.py or background 
    reconciliation tasks when a verified Safaricom callback is successfully processed.
    """
    wallet = Wallet.query.filter_by(tenant_id=tenant_id, id=wallet_id).first()
    if not wallet:
        return {"error": "Asynchronous validation failed: Target wallet context unmapped"}, 404

    # Deduplicate: Check if this specific payment gateway receipt has already been logged here
    duplicate = SavingsContribution.query.filter_by(
        tenant_id=tenant_id, 
        mpesa_transaction_id=mpesa_transaction_id
    ).first()
    
    if duplicate:
        return {"message": "Transaction already credited to savings framework", "id": duplicate.id}, 200

    contribution = SavingsContribution(
        tenant_id=tenant_id,
        wallet_id=wallet_id,
        savings_schedule_id=schedule_id,
        mpesa_transaction_id=mpesa_transaction_id,
        amount=Decimal(str(amount)),
        payment_channel="mpesa",
        status="completed",
        notes=f"Automated reconciliation for M-Pesa tracking trace link ID: {mpesa_transaction_id}"
    )
    
    db.session.add(contribution)
    db.session.commit()

    return {"status": "savings_record_instantiated", "contribution_id": contribution.id}, 201
