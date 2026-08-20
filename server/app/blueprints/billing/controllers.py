"""Subscription + commission engine (Section 2.3). Phase 4 build."""
from decimal import Decimal
from app.extensions import db
from app.models.subscription import SubscriptionPlan, Subscription
from app.models.tenant import Tenant
# from app.models.ledger import PlatformCommissionLog  # TODO: verify correct model name in ledger.py
from app.utils.responses import success_response, error_response


def list_plans():
    """
    Lists all available system tiers (e.g., Free, Growth, Enterprise) 
    and their underlying pricing models.
    """
    plans = SubscriptionPlan.query.all()
    return success_response([
        {
            "id": p.id,
            "name": p.name,
            "billing_model": p.billing_model,
            "monthly_price": str(p.monthly_price) if p.monthly_price else "0.00",
        }
        for p in plans
    ])


def subscribe_tenant_to_plan(tenant_id, payload):
    """
    Phase 4: Provisions a subscription package to a specific tenant workspace.
    Handles tier updates and overrides matching billing cycle details.
    """
    plan_id = payload.get("plan_id")
    if not plan_id:
        return error_response("Missing required parameter: plan_id", 422)

    tenant = Tenant.query.get(tenant_id)
    if not tenant:
        return error_response("Target tenant workspace not found", 404)

    plan = SubscriptionPlan.query.get(plan_id)
    if not plan:
        return error_response("Target subscription plan definition not found", 404)

    # Deactivate any existing active subscriptions to ensure strict lifecycle state tracking
    TenantSubscription.query.filter_by(tenant_id=tenant_id, is_active=True).update({"is_active": False})

    # Instantiate the new workspace tier contract mapping
    new_subscription = TenantSubscription(
        tenant_id=tenant_id,
        plan_id=plan.id,
        is_active=True,
        billing_cycle=payload.get("billing_cycle", "monthly"),
        status="active"
    )
    
    # Update tier definition attribute footprint on the tenant block itself
    tenant.tier = plan.name.lower()
    
    db.session.add(new_subscription)
    db.session.commit()

    return success_response({
        "tenant_id": tenant_id,
        "active_tier": plan.name,
        "billing_model": plan.billing_model,
        "subscription_id": new_subscription.id
    }, message=f"Tenant successfully upgraded to the '{plan.name}' tier.", status=200)


def record_transaction_fee_commission(tenant_id, mpesa_transaction_id, transaction_amount):
    """
    Phase 4: Audit system for continuous payment flows.
    Calculates operational commission cuts based on the tenant's structural tier.
    """
    tenant = Tenant.query.get(tenant_id)
    if not tenant:
        return {"error": "Tenant context missing for fee assessment"}, 404

    # Fetch calculation schema properties dynamically based on the current tenant tier profile
    amount_decimal = Decimal(str(transaction_amount))
    
    # Example Commission Tier Model Matrix
    if tenant.tier == "enterprise":
        commission_rate = Decimal("0.005") # 0.5% for high-volume custom contracts
    elif tenant.tier == "growth":
        commission_rate = Decimal("0.010") # 1.0% for mid-tier groups
    else:
        commission_rate = Decimal("0.015") # 1.5% standard fallback rate for base plans

    calculated_fee = amount_decimal * commission_rate

    # Log revenue directly into the ledger auditing database partition
    commission_log = PlatformCommissionLog(
        tenant_id=tenant_id,
        mpesa_transaction_id=mpesa_transaction_id,
        original_amount=amount_decimal,
        applied_rate=float(commission_rate),
        calculated_commission=calculated_fee,
        status="logged"
    )
    
    db.session.add(commission_log)
    db.session.commit()

    return {
        "log_id": commission_log.id,
        "commission_fee": float(calculated_fee),
        "status": "successfully_posted"
    }, 201
