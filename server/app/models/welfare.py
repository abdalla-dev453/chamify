"""
Welfare fund workflow (Section 4.3): a fast-track approval and disbursement
path for hospitalization or bereavement support.
"""
from app.extensions import db
from app.models.base import TenantScopedModel

WELFARE_STATUSES = ("submitted", "under_review", "approved", "disbursed", "rejected")
WELFARE_CATEGORIES = ("hospitalization", "bereavement", "other")


class WelfareRequest(TenantScopedModel):
    __tablename__ = "welfare_requests"

    tenant_id = db.Column(db.String(36), db.ForeignKey("tenants.id"), nullable=False, index=True)
    requester_user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)

    category = db.Column(db.Enum(*WELFARE_CATEGORIES, name="welfare_category"), nullable=False)
    amount_requested = db.Column(db.Numeric(12, 2), nullable=False)
    amount_approved = db.Column(db.Numeric(12, 2), nullable=True)
    description = db.Column(db.Text, nullable=True)
    supporting_document_url = db.Column(db.String(500), nullable=True)

    status = db.Column(db.Enum(*WELFARE_STATUSES, name="welfare_status"), default="submitted")
    reviewed_by_user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)

    requester = db.relationship("User", foreign_keys=[requester_user_id])