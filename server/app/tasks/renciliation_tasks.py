"""Nightly / retry-driven M-Pesa reconciliation sweep (Section 4.2)."""
from app.extensions import celery as celery_app


@celery_app.task(name="tasks.retry_unmatched_mpesa_transactions")
def retry_unmatched_mpesa_transactions():
    from app.models.mpesa import MpesaTransaction
    unmatched = MpesaTransaction.query.filter_by(status="unmatched").all()
    for txn in unmatched:
        pass  # TODO(Phase 2): re-attempt wallet matching by account_reference, escalate if still unmatched
    return {"checked": len(unmatched)}
