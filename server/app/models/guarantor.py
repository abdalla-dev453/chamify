"""
Loan guarantors (Section 4.1): a loan requires 2-3 member digital
guarantor sign-offs before disbursement is permitted.
"""
from app.extensions import db
from app.models.base import TenantScopedModel

GUARANTOR_STATUSES = ("pending", "approved", "declined")


class LoanGuarantor(TenantScopedModel):
    __tablename__ = "loan_guarantors"

    tenant_id = db.Column(db.String(36), db.ForeignKey("tenants.id"), nullable=False, index=True)
    loan_id = db.Column(db.String(36), db.ForeignKey("loans.id"), nullable=False, index=True)
    guarantor_user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)

    status = db.Column(db.Enum(*GUARANTOR_STATUSES, name="guarantor_status"), default="pending")
    amount_guaranteed = db.Column(db.Numeric(12, 2), nullable=False)
    responded_at = db.Column(db.DateTime, nullable=True)

    guarantor = db.relationship("User")

    __table_args__ = (
        db.UniqueConstraint("loan_id", "guarantor_user_id", name="uq_loan_guarantor"),
    )