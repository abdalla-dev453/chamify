"""
M-Pesa Daraja C2B/B2C records (Section 4.2). An incoming payment is matched
by account reference to a member wallet and posted to the ledger
automatically; B2C powers instant loan disbursement.
"""
from app.extensions import db
from app.models.base import TenantScopedModel

TXN_TYPES = ("c2b_contribution", "b2c_disbursement", "b2b_settlement")
TXN_STATUSES = ("initiated", "pending_callback", "reconciled", "failed", "unmatched")


class MpesaTransaction(TenantScopedModel):
    __tablename__ = "mpesa_transactions"
 
    tenant_id = db.Column(db.String(36), db.ForeignKey("tenants.id"), nullable=False, index=True)

    transaction_type = db.Column(db.Enum(*TXN_TYPES, name="mpesa_txn_type"), nullable=False)
    status = db.Column(db.Enum(*TXN_STATUSES, name="mpesa_txn_status"), default="initiated")

    mpesa_receipt_number = db.Column(db.String(50), unique=True, nullable=True, index=True)
    account_reference = db.Column(db.String(50), nullable=True)  # used to match wallet on C2B
    phone_number = db.Column(db.String(20), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)

    raw_callback_payload = db.Column(db.JSON, nullable=True)  # full Daraja callback, for audit
    matched_wallet_id = db.Column(db.String(36), db.ForeignKey("wallets.id"), nullable=True)

    def __repr__(self):
        return f"<MpesaTransaction {self.mpesa_receipt_number} {self.amount}>"