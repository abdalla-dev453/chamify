"""USSD session handler (Section 4.5): balance checks, loan requests, and
guarantor approval for members without smartphones — a first-class client
of the same API, not a bolt-on. Phase 6 build.

Africa's Talking POSTs sessionId/phoneNumber/text on every keypress; text
accumulates as "1*2*50" through the session, so the handler is a simple
state machine keyed off text.split('*')."""
from app.models.user import User
from app.models.wallet import Wallet


def handle_ussd_session(session_id, phone_number, text):
    steps = text.split("*") if text else []

    if not steps or steps == [""]:
        return "CON Welcome to ChamaLedger\n1. Check balance\n2. Request loan\n3. Approve guarantee"

    if steps[0] == "1":
        user = User.query.filter_by(phone_number=phone_number).first()
        if not user:
            return "END No account found for this number."
        wallet = Wallet.query.filter_by(owner_user_id=user.id, wallet_type="member").first()
        balance = wallet.balance if wallet else 0
        return f"END Your wallet balance is KES {balance}"

    # TODO(Phase 6): steps[0] == "2" -> loan request flow (amount, term)
    # TODO(Phase 6): steps[0] == "3" -> pending guarantee approvals
    return "END Invalid selection."
