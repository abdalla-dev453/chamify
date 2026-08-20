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


def initiate_b2c_disbursement(payload):
    """
    Triggers a Business-to-Customer (B2C) loan payout using Daraja Service.
    Creates a pending transaction entry tracking the request cycle.
    """
    from app.services.daraja_service import DarajaService  # Local import to prevent circular dependencies
    
    tenant_id = payload.get("tenant_id")
    phone_number = payload.get("phone_number")
    amount = payload.get("amount")
    loan_id = payload.get("loan_id")  # Optional reference to link specific loan context

    # 1. Dispatch asynchronous downstream API handshake via Safaricom Daraja integration
    daraja = DarajaService(tenant_id=tenant_id)
    daraja_response, status_code = daraja.send_b2c_payout(
        phone_number=phone_number,
        amount=amount,
        remarks=f"Loan Payout Reference ID: {loan_id or 'N/A'}"
    )

    if status_code != 200:
        return {"error": "Failed to hand over transaction payload to Daraja gateway"}, status_code

    # 2. Track outgoing request trace in your ledger audit log with a 'pending' state
    originator_conversation_id = daraja_response.get("OriginatorConversationID")
    conversation_id = daraja_response.get("ConversationID")

    txn = MpesaTransaction(
        tenant_id=tenant_id,
        transaction_type="b2c_disbursement",
        phone_number=phone_number,
        amount=amount,
        account_reference=f"LOAN-{loan_id or 'GENERIC'}",
        mpesa_receipt_number=None,  # Not known until webhook callback fires
        originator_conversation_id=originator_conversation_id,
        conversation_id=conversation_id,
        status="pending",
        raw_callback_payload={"initial_handshake_response": daraja_response}
    )
    db.session.add(txn)
    db.session.commit()

    return {"message": "Payout instruction accepted by gateway", "conversation_id": conversation_id}, 202


def handle_b2c_callback(tenant_id, payload):
    """
    Handles outcomes from Safaricom's B2C callback.
    Validates ResultCode: 0 represents a complete, secure delivery.
    """
    result_data = payload.get("Result", {})
    result_code = result_data.get("ResultCode")
    conversation_id = result_data.get("ConversationID")

    # Match incoming asynchronous callback to your tracked transaction entry
    txn = MpesaTransaction.query.filter_by(tenant_id=tenant_id, conversation_id=conversation_id).first()
    if not txn:
        return error_response("Transaction context not found for provided Conversation ID", 404)

    txn.raw_callback_payload = payload

    if result_code == 0:
        # Payout was fully acknowledged and completed by Safaricom infrastructure
        txn.status = "reconciled"
        
        # Parse official tracking receipts passed inside the deep result array parameters
        result_params = result_data.get("ResultParameters", {}).get("ResultParameter", [])
        receipt = next((p.get("Value") for p in result_params if p.get("Key") == "TransactionID"), None)
        if receipt:
            txn.mpesa_receipt_number = receipt

        db.session.commit()

        # Debit the corresponding organization/member wallet structure to log the payout
        wallet = Wallet.query.filter_by(tenant_id=tenant_id, phone_number=txn.phone_number).first()
        if wallet:
            post_entry(
                tenant_id, wallet, scope="member", entry_type="debit",
                source_type="loan_disbursement", amount=txn.amount,
                source_id=txn.id, memo="M-Pesa B2C Loan Payout", mpesa_transaction_id=txn.id,
            )
        return success_response({"status": "disbursed_and_reconciled"}, status=200)
    else:
        # Failure/Timeout scenario occurred on Safaricom's end
        txn.status = "failed"
        db.session.commit()
        return success_response({"status": "payout_failed_by_broker"}, status=200)


def initiate_stk_push(tenant_id, payload):
    """
    Launches an express M-Pesa STK Push popup request window to a member's device
    for instant self-service wallet contributions.
    """
    from app.services.daraja_service import DarajaService
    
    amount = payload.get("amount")
    phone_number = payload.get("phone_number")
    wallet_id = payload.get("wallet_id")

    wallet = Wallet.query.filter_by(tenant_id=tenant_id, id=wallet_id).first()
    if not wallet:
        return error_response("Target wallet context mismatch", 404)

    daraja = DarajaService(tenant_id=tenant_id)
    daraja_response, status_code = daraja.trigger_stk_push(
        phone_number=phone_number,
        amount=amount,
        account_reference=str(wallet_id),
        description="Wallet Contribution"
    )

    if status_code != 200:
        return error_response("STK Push handshake rejected by gateway", status_code, errors=daraja_response)

    # Log tracking transaction so your app is ready to catch the validation webhook next
    merchant_request_id = daraja_response.get("MerchantRequestID")
    checkout_request_id = daraja_response.get("CheckoutRequestID")

    txn = MpesaTransaction(
        tenant_id=tenant_id,
        transaction_type="stk_contribution",
        phone_number=phone_number,
        amount=amount,
        account_reference=str(wallet_id),
        merchant_request_id=merchant_request_id,
        checkout_request_id=checkout_request_id,
        status="pending",
        matched_wallet_id=wallet.id,
        raw_callback_payload={"stk_initialization_metadata": daraja_response}
    )
    db.session.add(txn)
    db.session.commit()

    return success_response({"checkout_request_id": checkout_request_id}, message="STK Push dispatched to phone", status=200)
