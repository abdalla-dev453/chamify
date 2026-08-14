"""
Dividends engine (Section 4.1): end-of-year distribution computed from
share or savings history.
"""
from app.extensions import db
from app.models.base import TenantScopedModel

DIVIDEND_RUN_STATUSES = ("draft", "approved", "disbursed")


class DividendRun(TenantScopedModel):
    __tablename__ = "dividend_runs"

    tenant_id = db.Column(db.String(36), db.ForeignKey("tenants.id"), nullable=False, index=True)
    financial_year = db.Column(db.Integer, nullable=False)
    total_pool_amount = db.Column(db.Numeric(14, 2), nullable=False)
    basis = db.Column(db.String(20), default="savings_history")  # or "shares"
    status = db.Column(db.Enum(*DIVIDEND_RUN_STATUSES, name="dividend_run_status"), default="draft")

    allocations = db.relationship("DividendAllocation", backref="run", lazy="dynamic", cascade="all, delete-orphan")


class DividendAllocation(TenantScopedModel):
    __tablename__ = "dividend_allocations"

    tenant_id = db.Column(db.String(36), db.ForeignKey("tenants.id"), nullable=False, index=True)
    run_id = db.Column(db.String(36), db.ForeignKey("dividend_runs.id"), nullable=False)
    wallet_id = db.Column(db.String(36), db.ForeignKey("wallets.id"), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)