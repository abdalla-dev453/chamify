"""Omnichannel dispatch (Section 4.5): SMS/WhatsApp/email fired from one
event bus. Actual delivery is async via app/tasks/alert_tasks.py so a
slow SMS gateway never blocks a request."""
from app.tasks.alert_tasks import send_alert_task
from app.utils.responses import success_response


def send_test_alert(tenant_id, channel, to, message):
    send_alert_task.delay(tenant_id, channel, to, message)
    return success_response(None, message="Alert queued")

# TODO(Phase 6): template management (en/sw copy), delivery-status webhooks
