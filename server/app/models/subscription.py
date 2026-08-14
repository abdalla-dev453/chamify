"""
Billing (Section 2.3): subscription plans + the shared/dedicated Paybill
transaction-fee model, tiered by monetization mechanism.
"""
from app.extensions import db
from app.models.base import BaseModel, TenantScopedModel

BILLING_MODELS = ("subscription", "transaction_fee", "feature_addon")


class SubscriptionPlan(BaseModel):
    """Global — the same plan catalogue is offered to every tenant."""
    __tablename__ = "subscription_plans"

    name = db.Column(db.String(100), nullable=False)
    billing_model = db.Column(db.Enum(*BILLING_MODELS, name="billing_model"), nullable=False)
    monthly_price = db.Column(db.Numeric(10, 2), nullable=True)
    transaction_fee_percent = db.Column(db.Numeric(4, 3), nullable=True)  # e.g. 0.010 = 1%
    max_active_members = db.Column(db.Integer, nullable=True)
    features = db.Column(db.JSON, default=dict)  # {"ussd": true, "sms_blast_packs": 500}


class Subscription(TenantScopedModel):
    __tablename__ = "subscriptions"

    tenant_id = db.Column(db.String(36), db.ForeignKey("tenants.id"), nullable=False, unique=True)
    plan_id = db.Column(db.String(36), db.ForeignKey("subscription_plans.id"), nullable=False)

    is_active = db.Column(db.Boolean, default=True)
    current_period_end = db.Column(db.DateTime, nullable=True)

    plan = db.relationship("SubscriptionPlan")
