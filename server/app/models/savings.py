"""
Flexible savings regimes (Section 4.1): weekly/monthly/merry-go-round
rotation schedules with automated late-payment penalties.
"""
from app.extensions import db
from app.models.base import TenantScopedModel

FREQUENCIES = ("weekly", "monthly", "merry_go_round")


class SavingsSchedule(TenantScopedModel):
    __tablename__ = "savings_schedules"

    tenant_id = db.Column(db.String(36), db.ForeignKey("tenants.id"), nullable=False, index=True)
    name = db.Column(db.String(150), nullable=False)
    frequency = db.Column(db.Enum(*FREQUENCIES, name="savings_frequency"), nullable=False)
    expected_amount = db.Column(db.Numeric(12, 2), nullable=False)
    penalty_rate = db.Column(db.Numeric(4, 3), nullable=False, default=0.05)  # 5% default, Section 4.1
    grace_period_days = db.Column(db.Integer, default=3)
    is_active = db.Column(db.Boolean, default=True)

    contributions = db.relationship("SavingsContribution", backref="schedule", lazy="dynamic")


class SavingsContribution(TenantScopedModel):
    __tablename__ = "savings_contributions"

    tenant_id = db.Column(db.String(36), db.ForeignKey("tenants.id"), nullable=False, index=True)
    wallet_id = db.Column(db.String(36), db.ForeignKey("wallets.id"), nullable=False, index=True)
    schedule_id = db.Column(db.String(36), db.ForeignKey("savings_schedules.id"), nullable=True)

    amount = db.Column(db.Numeric(12, 2), nullable=False)
    penalty_applied = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    is_late = db.Column(db.Boolean, default=False)
    mpesa_transaction_id = db.Column(db.String(36), db.ForeignKey("mpesa_transactions.id"), nullable=True)

    def __repr__(self):
        return f"<SavingsContribution {self.amount} wallet={self.wallet_id}>"