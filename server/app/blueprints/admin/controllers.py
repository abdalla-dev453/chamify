"""Global Admin Super-Dashboard (Section 5) — platform-operator view.
NOT exposed to tenant admins; every route here requires role=system_admin.
Phase 8 (beta launch monitoring) build, but the control-tower shape is
scaffolded now so Phase 1-7 modules have somewhere to report metrics to."""
from app.extensions import db
from app.utils.responses import success_response, error_response
from app.models.tenant import Tenant


def platform_overview():
    """
    Returns platform-wide metrics across all tenants.
    Calculates aggregated ledger volume, active balances, and platform revenue.
    """
    from sqlalchemy import func
    from app.models.mpesa import MpesaTransaction
    
    total_tenants = Tenant.query.count()
    active_tenants = Tenant.query.filter_by(is_active=True, is_suspended=False).count()
    
    # Calculate total transactional processing volume through the core gateway infrastructure
    platform_volume = db.session.query(func.sum(MpesaTransaction.amount)).filter(
        MpesaTransaction.status == "reconciled"
    ).scalar() or 0
    
    # Calculate total cash outflow assigned to running business loans
    loans_disbursed = db.session.query(func.sum(MpesaTransaction.amount)).filter(
        MpesaTransaction.status == "reconciled",
        MpesaTransaction.transaction_type == "b2c_disbursement"
    ).scalar() or 0
    
    # Platform-wide revenue model (e.g., standard 1.5% ecosystem transaction processing fee)
    commission_earned = float(platform_volume) * 0.015

    data = {
        "total_tenants": total_tenants,
        "active_tenants": active_tenants,
        "platform_volume": float(platform_volume),
        "loans_disbursed": float(loans_disbursed),
        "commission_earned": commission_earned
    }

    return success_response(data, "Platform overview retrieved successfully", 200), 200


def kyc_queue():
    """
    Returns pending user identity verifications requiring system admin approval.
    """
    pending = Tenant.query.filter_by(iprs_verified=False).all()
    data = [{"id": t.id, "name": t.name, "tier": t.tier} for t in pending]

    return success_response(data, "KYC queue retrieved successfully", 200), 200


def suspend_tenant_workspace(tenant_id, reason):
    """
    Phase 8: Administrative block mechanism. Freezes a workspace container 
    and locks down state transactions immediately.
    """
    tenant = Tenant.query.get(tenant_id)
    if not tenant:
        return {"error": "Target tenant not found"}, 404
        
    if tenant.is_suspended:
        return {"error": "Tenant workspace is already in a suspended state"}, 400
        
    # Toggle architectural enforcement parameters
    try:
        tenant.is_suspended = True
        tenant.is_active = False
    
    # Save the audit trail information into your configuration storage block if tracking fields exist
        if hasattr(tenant, "suspension_reason"):
            tenant.suspension_reason = reason
        
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return {"error": f"Failed to update tenant state: s{str(e)}"}, 500

    
    return {
        "tenant_id": tenant_id,
        "status": "suspended",
        "reason": reason
    }, 200


def activate_tenant_workspace(tenant_id):
    """
    Phase 8: Restores full platform functionality to a suspended group environment.
    """
    tenant = Tenant.query.get(tenant_id)
    if not tenant:
        return {"error": "Target tenant not found"}, 404
        
    if not tenant.is_suspended:
        return {"error": "Tenant workspace is active and does not require lifting restrictions"}, 400
        
    # Restore operational routing states
    tenant.is_suspended = False
    tenant.is_active = True
    
    if hasattr(tenant, "suspension_reason"):
        tenant.suspension_reason = None
        
    db.session.commit()
    
    return {
        "tenant_id": tenant_id,
        "status": "active"
    }, 200


def map_custom_domain_routing(tenant_id, payload):
    """
    Phase 8: Whitelists a customized DNS domain endpoint layout for white-labeled 
    group platforms (e.g., 'portal.chama_name.com').
    """
    custom_domain = payload.get("custom_domain") or payload.get("domain_name")
    if not custom_domain:
        return {"error": "Missing 'custom_domain' field in incoming registration string"}, 422
        
    tenant = Tenant.query.get(tenant_id)
    if not tenant:
        return {"error": "Target tenant footprint not found"}, 404
        
    # Check for domain collisions across other platform tenants
    collision = Tenant.query.filter_by(custom_domain=custom_domain).first()
    if collision and collision.id != tenant_id:
        return {"error": "Custom domain is already registered to another active workspace container"}, 409
        
    tenant.custom_domain = custom_domain
    db.session.commit()
    
    return {
        "tenant_id": tenant_id,
        "mapped_domain": custom_domain,
        "status": "configured"
    }, 200
