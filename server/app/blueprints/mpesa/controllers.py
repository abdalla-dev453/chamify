"""C2B/B2C webhook handling + reconciliation (Section 4.2). Phase 2 build.
Real Daraja calls go through app/services/daraja_service.py — this file
owns the business logic of matching a payment to a wallet and posting it."""
from app.extensions import db
from app.models.mpesa import MpesaTransaction
from app.models.wallet import Wallet
from app.utils.responses import success_response, error_response
from app.blueprints.ledger.controllers import post_entry


def handle_c2b_callback(tenant_id, payload):
    """
    Daraja C2B callback shape (sandbox): TransID, TransAmount, MSISDN, BillRefNumber.
    account_reference (BillRefNumber) is matched against a member's wallet.
    """
    account_reference = payload.get("BillRefNumber")
    amount = payload.get("TransAmount")
    phone = payload.get("MSISDN")
    receipt = payload.get("TransID")

    wallet = Wallet.query.filter_by(tenant_id=tenant_id, id=account_reference).first()
    txn = MpesaTransaction(
        tenant_id=tenant_id, transaction_type="c2b_contribution",
        mpesa_receipt_number=receipt, account_reference=account_reference,
        phone_number=phone, amount=amount, raw_callback_payload=payload,
        matched_wallet_id=wallet.id if wallet else None,
        status="reconciled" if wallet else "unmatched",
    )
    db.session.add(txn)
    db.session.commit()

    if wallet:
        post_entry(
            tenant_id, wallet, scope="member", entry_type="credit",
            source_type="savings_contribution", amount=amount,
            source_id=txn.id, memo="M-Pesa contribution", mpesa_transaction_id=txn.id,
        )
        # TODO(Phase 2): also create a SavingsContribution row linked to txn.id

    return success_response({"reconciled": bool(wallet)}, status=200)

# TODO(Phase 2): initiate_b2c_disbursement() for loan payouts (Section 4.2)
# TODO(Phase 2): STK push initiation for member-initiated contributions

