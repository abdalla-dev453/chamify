"""Async PDF statement generation (Section 4.4) — kept off the request cycle."""
from app.extensions import celery as celery_app


@celery_app.task(name="tasks.generate_statement")
def generate_statement(wallet_id, date_from, date_to):
    # TODO(Phase 5): pull LedgerEntry rows, render PDF (e.g. WeasyPrint/ReportLab),
    # upload to object storage, notify member via comms/controllers.send_test_alert
    return {"wallet_id": wallet_id, "status": "queued"}
