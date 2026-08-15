"""Global Admin Super-Dashboard (Section 5) — platform-operator view.
NOT exposed to tenant admins; every route here requires role=system_admin.
Phase 8 (beta launch monitoring) build, but the control-tower shape is
scaffolded now so Phase 1-7 modules have somewhere to report metrics to."""
from app.utils.responses import success_response
from app.models.tenant import Tenant


def platform_overview():
    total_tenants = Tenant.query.count()
    active_tenants = Tenant.query.filter_by(is_active=True, is_suspended=False).count()
    return success_response({
        "total_tenants": total_tenants,
        "active_tenants": active_tenants
        # TODO: add platform_volume, loans_disabuersed, commission_earned
    })


def kyc_queue():
    pending = Tenant.query.filter_by(iprs_verified=False).all()
    return success_response([{"id": t.id, "name": t.name, "tier": t.tier} for t in pending])

# TODO(Phase 8): suspend_tenant(), activate_tenant(), map_custom_domain()
