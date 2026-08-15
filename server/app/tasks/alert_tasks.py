"""Fan-out for SMS/WhatsApp/email (Section 4.5) — the 'same event bus' referenced in the blueprint."""
from app.extensions import celery as celery_app


@celery_app.task(name="tasks.send_alert")
def send_alert_task(tenant_id, channel, to, message):
    if channel == "sms":
        from app.services.africastalking_service import send_sms
        return send_sms(to, message)
    # TODO(Phase 6): channel == "whatsapp" / "email"
    return {"status": "unsupported_channel", "channel": channel}
