"""
Micro-lending engine (Section 4.1): reducing-balance or flat-rate interest,
automated appraisal against a savings multiplier (loan limit = N x savings).
"""
from app.extensions import db
from app.models.base import TenantScopedModel

LOAN_STATUSES = (
    "pending_appraisal", "pending_guarantors", "approved",
    "disbursed", "repaying", "closed", "defaulted", "rejected",
)
INTEREST_METHODS = ("reducing_balance", "flat_rate")


class Loan(TenantScopedModel):
    __tablename__ = "loans"

    tenant_id = db.Column(db.String(36), db.ForeignKey("tenants.id"), nullable=False, index=True)
    wallet_id = db.Column(db.String(36), db.ForeignKey("wallets.id"), nullable=False, index=True)
    borrower_user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)

    principal = db.Column(db.Numeric(12, 2), nullable=False)
    interest_method = db.Column(db.Enum(*INTEREST_METHODS, name="interest_method"), default="reducing_balance")
    interest_rate = db.Column(db.Numeric(5, 4), nullable=False)  # e.g. 0.1200 = 12%
    term_months = db.Column(db.Integer, nullable=False)

    savings_multiplier_used = db.Column(db.Numeric(4, 2), default=3.0)  # Section 4.1 default 3x
    status = db.Column(db.Enum(*LOAN_STATUSES, name="loan_status"), default="pending_appraisal")

    disbursed_at = db.Column(db.DateTime, nullable=True)
    disbursement_mpesa_id = db.Column(db.String(36), db.ForeignKey("mpesa_transactions.id"), nullable=True)

    borrower = db.relationship("User")
    guarantors = db.relationship("LoanGuarantor", backref="loan", lazy="dynamic", cascade="all, delete-orphan")

    def required_guarantor_count(self) -> int:
        return 2 if self.principal <= 50000 else 3  # simple policy, tune per tenant later