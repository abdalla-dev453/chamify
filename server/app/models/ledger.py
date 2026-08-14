"""
Triple-entry ledger (Section 4.4 / 7): every transaction posts to a member
ledger, a group ledger, and a system ledger. Nothing is ever deleted —
only reversed with an approved credit/debit note.
"""
from app.extensions import db"""
Triple-entry ledger (Section 4.4 / 7): every transaction posts to a member
ledger, a group ledger, and a system ledger. Nothing is ever deleted —
only reversed with an approved credit/debit note.
"""
from app.extensions import db
from app.models.base import TenantScopedModel

LEDGER_SCOPES = ("member", "group", "system")
ENTRY_TYPES = ("credit", "debit")
SOURCE_TYPES = (
    "savings_contribution", "loan_disbursement", "loan_repayment",
    "welfare_payout", "dividend_payout", "fee", "reversal",
)


class LedgerEntry(TenantScopedModel):
    __tablename__ = "ledger_entries"

    tenant_id = db.Column(db.String(36), db.ForeignKey("tenants.id"), nullable=False, index=True)
    wallet_id = db.Column(db.String(36), db.ForeignKey("wallets.id"), nullable=True, index=True)

    scope = db.Column(db.Enum(*LEDGER_SCOPES, name="ledger_scope"), nullable=False)
    entry_type = db.Column(db.Enum(*ENTRY_TYPES, name="ledger_entry_type"), nullable=False)
    source_type = db.Column(db.Enum(*SOURCE_TYPES, name="ledger_source_type"), nullable=False)
    source_id = db.Column(db.String(36), nullable=True)  # polymorphic ref, e.g. loan_id / contribution_id

    amount = db.Column(db.Numeric(14, 2), nullable=False)
    balance_after = db.Column(db.Numeric(14, 2), nullable=False)
    memo = db.Column(db.String(255), nullable=True)

    mpesa_transaction_id = db.Column(db.String(36), db.ForeignKey("mpesa_transactions.id"), nullable=True)

    # Reversal chain — an entry is never deleted, only reversed by a new entry
    reverses_entry_id = db.Column(db.String(36), db.ForeignKey("ledger_entries.id"), nullable=True)
    is_reversed = db.Column(db.Boolean, default=False)

    def __repr__(self):
        return f"<LedgerEntry {self.entry_type} {self.amount} scope={self.scope}>"

from app.models.base import TenantScopedModel

LEDGER_SCOPES = ("member", "group", "system")
ENTRY_TYPES = ("credit", "debit")
SOURCE_TYPES = (
    "savings_contribution", "loan_disbursement", "loan_repayment",
    "welfare_payout", "dividend_payout", "fee", "reversal",
)


class LedgerEntry(TenantScopedModel):
    __tablename__ = "ledger_entries"

    tenant_id = db.Column(db.String(36), db.ForeignKey("tenants.id"), nullable=False, index=True)
    wallet_id = db.Column(db.String(36), db.ForeignKey("wallets.id"), nullable=True, index=True)

    scope = db.Column(db.Enum(*LEDGER_SCOPES, name="ledger_scope"), nullable=False)
    entry_type = db.Column(db.Enum(*ENTRY_TYPES, name="ledger_entry_type"), nullable=False)
    source_type = db.Column(db.Enum(*SOURCE_TYPES, name="ledger_source_type"), nullable=False)
    source_id = db.Column(db.String(36), nullable=True)  # polymorphic ref, e.g. loan_id / contribution_id

    amount = db.Column(db.Numeric(14, 2), nullable=False)
    balance_after = db.Column(db.Numeric(14, 2), nullable=False)
    memo = db.Column(db.String(255), nullable=True)

    mpesa_transaction_id = db.Column(db.String(36), db.ForeignKey("mpesa_transactions.id"), nullable=True)

    # Reversal chain — an entry is never deleted, only reversed by a new entry
    reverses_entry_id = db.Column(db.String(36), db.ForeignKey("ledger_entries.id"), nullable=True)
    is_reversed = db.Column(db.Boolean, default=False)

    def __repr__(self):
        return f"<LedgerEntry {self.entry_type} {self.amount} scope={self.scope}>"
