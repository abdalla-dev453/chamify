"""Savings schedules + contributions (Section 4.1). Phase 1/2 build."""
from app.models.savings import SavingsSchedule, SavingsContribution
from app.middleware.tenant_scope import scoped_query
from app.utils.responses import success_response
# TODO(Phase 1): create_schedule(), record_manual_contribution()
# TODO(Phase 2): record_mpesa_contribution() — called from mpesa/controllers.py on reconciliation


def list_schedules():
    schedules = scoped_query(SavingsSchedule).all()
    return success_response([
        {"id": s.id, "name": s.name, "frequency": s.frequency, "expected_amount": str(s.expected_amount)}
        for s in schedules
    ])
