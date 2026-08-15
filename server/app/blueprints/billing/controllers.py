"""Subscription + commission engine (Section 2.3). Phase 4 build."""

from app.models.subscription import SubscriptionPlan
from app.utils.responses import success_response


def list_plans():
    plans = SubscriptionPlan.query.all()
    return success_response([
        {
            "id": p.id,
            "name": p.name,
            "billing_model": p.billing_model,
            "monthly_price": str(p.monthly_price) if p.monthly_price else None,
        }
        for p in plans
    ])


# TODO(Phase 4): subscribe_tenant_to_plan(), record_transaction_fee_commission()
