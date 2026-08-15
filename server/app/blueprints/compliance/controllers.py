"""SASRA-style reports, member statements, audit log queries (Section 4.4).
Phase 5 build. Statement PDF generation is dispatched to a Celery task
(app/tasks/statement_tasks.py) so the request/response cycle stays fast."""
from app.models.audit_log import AuditLog
from app.middleware.tenant_scope import scoped_query
from app.utils.responses import success_response


def list_audit_log():
    logs = scoped_query(AuditLog).order_by(AuditLog.created_at.desc()).limit(200).all()
    return success_response([{"action": l.action, "entity_type": l.entity_type, "created_at": l.created_at.isoformat()} for l in logs])

# TODO(Phase 5): request_statement() -> enqueues tasks.statement_tasks.generate_statement
# TODO(Phase 5): trial_balance_report(), sasra_balance_sheet()
