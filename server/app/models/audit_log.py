"""
Immutable audit trail (Section 4.4 / 5) — feeds both per-tenant compliance
views and the Global Admin Super-Dashboard's fintech ledger audits.
"""
from app.extensions import db
from app.models.base import TenantScopedModel


class AuditLog(TenantScopedModel):
    __tablename__ = "audit_logs"

    tenant_id = db.Column(db.String(36), db.ForeignKey("tenants.id"), nullable=True, index=True)
    actor_user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)

    action = db.Column(db.String(100), nullable=False)   # e.g. "loan.approved"
    entity_type = db.Column(db.String(100), nullable=True)
    entity_id = db.Column(db.String(36), nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    metadata_json = db.Column(db.JSON, default=dict)
