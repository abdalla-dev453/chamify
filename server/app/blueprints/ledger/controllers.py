"""Triple-entry posting engine (Section 4.4). Every credit/debit in the
system should ultimately call post_entry() — never write balances directly."""
from app.extensions import db
from app.models.ledger import LedgerEntry
from app.middleware.tenant_scope import scoped_query
from app.schemas.ledger_schema import ledger_entries_schema
from app.utils.responses import success_response


def post_entry(tenant_id, wallet, scope, entry_type, source_type, amount, source_id=None, memo=None, mpesa_transaction_id=None):
    """Single choke point for every ledger write — this is what makes the
    'nothing is ever deleted, only reversed' rule from Section 4.4 enforceable."""
    delta = amount if entry_type == "credit" else -amount
    new_balance = (wallet.balance or 0) + delta
    wallet.balance = new_balance

    entry = LedgerEntry(
        tenant_id=tenant_id, wallet_id=wallet.id, scope=scope, entry_type=entry_type,
        source_type=source_type, source_id=source_id, amount=amount,
        balance_after=new_balance, memo=memo, mpesa_transaction_id=mpesa_transaction_id,
    )
    db.session.add(entry)
    db.session.add(wallet)
    db.session.commit()
    return entry


def reverse_entry(entry_id):
    """Posts an equal-and-opposite entry rather than deleting the original —
    required for the audit trail in Section 4.4."""
    original = LedgerEntry.query.get(entry_id)
    if not original or original.is_reversed:
        return None
    from app.models.wallet import Wallet
    wallet = Wallet.query.get(original.wallet_id)
    opposite_type = "debit" if original.entry_type == "credit" else "credit"
    reversal = post_entry(
        original.tenant_id, wallet, original.scope, opposite_type,
        "reversal", original.amount, source_id=original.id, memo=f"Reversal of {original.id}",
    )
    original.is_reversed = True
    db.session.add(original)
    db.session.commit()
    return reversal


def wallet_statement(wallet_id):
    entries = scoped_query(LedgerEntry).filter_by(wallet_id=wallet_id).order_by(LedgerEntry.created_at.desc()).all()
    return success_response(ledger_entries_schema.dump(entries))
