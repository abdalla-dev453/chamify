"""USSD session handler (Section 4.5): balance checks, loan requests, and
guarantor approval for members without smartphones — a first-class client
of the same API, not a bolt-on. Phase 6 build.

Africa's Talking POSTs sessionId/phoneNumber/text on every keypress; text
accumulates as "1*2*50" through the session, so the handler is a simple
state machine keyed off text.split('*')."""
from decimal import Decimal
from flask import g
from app.extensions import db
from app.models.user import User
from app.models.wallet import Wallet
from app.models.loan import Loan
from app.models.guarantor import LoanGuarantor
from app.blueprints.loans import controllers as loan_controllers


def handle_ussd_session(session_id, phone_number, text):
    """
    State machine parsing Africa's Talking progressive string format.
    'CON' maintains the carrier session window; 'END' drops it.
    """
    # Clean text to handle empty input parameters gracefully
    steps = [s.strip() for s in text.split("*")] if text else []

    # 1. Look up user context via caller identity
    user = User.query.filter_by(phone_number=phone_number).first()
    if not user:
        return "END System Error: No account found for this mobile number. Please contact your Chama Admin."

    # Bind tenant context automatically onto thread state for scoped engines
    g.tenant_id = user.tenant_id

    # 2. Base Landing Menu Tree Selection
    if not steps or steps == [""]:
        return "CON Welcome to Chamify\n1. Check Balance\n2. Request Loan\n3. Approve Guarantee"

    # ==========================================
    # BRANCH 1: BALANCE ENQUIRY
    # ==========================================
    if steps[0] == "1":
        wallet = Wallet.query.filter_by(tenant_id=user.tenant_id, phone_number=phone_number).first()
        balance = wallet.balance if wallet else 0
        return f"END Your wallet balance is KES {balance:,.2f}"

    # ==========================================
    # BRANCH 2: LOAN APPLICATION PIPELINE
    # ==========================================
    elif steps[0] == "2":
        wallet = Wallet.query.filter_by(tenant_id=user.tenant_id, phone_number=phone_number).first()
        if not wallet:
            return "END Error: No wallet container mapped to your member profile."

        # Step 2.1: Input Principal Amount
        if len(steps) == 1:
            return "CON Enter Loan Amount (KES):"

        # Step 2.2: Input Term Duration
        elif len(steps) == 2:
            return "CON Enter Repayment Period (Months):"

        # Step 2.3: Final Confirmation Screen
        elif len(steps) == 3:
            amount = steps[1]
            months = steps[2]
            return f"CON Confirm Loan Request:\nAmount: KES {amount}\nPeriod: {months} Months\n\n1. Confirm\n2. Cancel"

        # Step 2.4: Execution Handover
        elif len(steps) == 4:
            if steps[3] != "1":
                return "END Loan request cancelled by user."

            try:
                # Structure payload contract matching the core loan controller apply engine
                loan_payload = {
                    "wallet_id": wallet.id,
                    "principal": float(steps[1]),
                    "term_months": int(steps[2]),
                    "interest_method": "reducing_balance",
                    "guarantor_user_ids": []  # Appended downstream by member via UI/USSD later
                }
                
                # Execute application directly through your production appraisal pipeline
                response, status_code = loan_controllers.apply_for_loan(
                    loan_payload, user.tenant_id, user.id
                )
                
                if status_code == 201:
                    return f"END Success! Your loan of KES {float(steps[1]):,.2f} has been submitted for review."
                else:
                    # Capture functional messages (like 'exceeds savings multiplier thresholds')
                    error_msg = response.get("message", "Appraisal failed")
                    return f"END Request Denied: {error_msg}"
                    
            except Exception as e:
                return f"END Processing Exception: {str(e)}"

    # ==========================================
    # BRANCH 3: GUARANTOR SIGN-OFF WORKFLOW
    # ==========================================
    elif steps[0] == "3":
        # Find pending signature targets allocated to this specific caller identity
        pending_guarantees = LoanGuarantor.query.filter_by(
            tenant_id=user.tenant_id, 
            guarantor_user_id=user.id, 
            status="pending"
        ).order_by(LoanGuarantor.created_at.desc()).all()

        if not pending_guarantees:
            return "END You have no pending guarantee approval requests at this time."

        # Step 3.1: Present List of Pending Selection Records
        if len(steps) == 1:
            menu = "CON Select loan to guarantee:\n"
            for idx, g_req in enumerate(pending_guarantees, start=1):
                loan_ref = Loan.query.get(g_req.loan_id)
                amount = loan_ref.principal if loan_ref else 0
                menu += f"{idx}. Loan #{g_req.loan_id} (KES {amount:,.0f})\n"
            return menu

        # Step 3.2: Confirm or Decline the Chosen Item
        elif len(steps) == 2:
            try:
                choice_idx = int(steps[1]) - 1
                if choice_idx < 0 or choice_idx >= len(pending_guarantees):
                    return "END Invalid menu selection entry index."
            except ValueError:
                return "END Invalid input syntax parameters."

            target_guarantee = pending_guarantees[choice_idx]
            loan_ref = Loan.query.get(target_guarantee.loan_id)
            
            return (
                f"CON Guarantee Loan #{target_guarantee.loan_id}?\n"
                f"Pledged Risk: KES {target_guarantee.amount_pledged:,.2f}\n\n"
                f"1. Approve & Sign\n2. Decline Request"
            )

        # Step 3.3: Commit Signature Modifications Instantly
        elif len(steps) == 3:
            try:
                choice_idx = int(steps[1]) - 1
                target_guarantee = pending_guarantees[choice_idx]
            except (ValueError, IndexErrors):
                return "END Fatal synchronization reference mismatch."

            if steps[2] == "1":
                # Delegate to the anti-fraud secure signature loop built in Phase 3
                response, status_code = loan_controllers.approve_guarantor(
                    target_guarantee.loan_id, user.id
                )
                
                if status_code == 200:
                    return f"END Signature complete! You have co-signed Loan #{target_guarantee.loan_id}."
                return f"END Authorization Failed: {response.get('message', 'Error')}"
            
            elif steps[2] == "2":
                target_guarantee.status = "rejected"
                
                # Rollback loan context directly to lock execution downstream
                loan_ref = Loan.query.get(target_guarantee.loan_id)
                if loan_ref:
                    loan_ref.status = "rejected_by_guarantor"
                    
                db.session.commit()
                return f"END Request declined. Loan #{target_guarantee.loan_id} cancellation logged."

    return "END Selection profile mismatch. Dropping session."
