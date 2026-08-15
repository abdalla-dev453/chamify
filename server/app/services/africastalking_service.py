"""
SMS/WhatsApp/USSD delivery (Section 4.5). Wraps Africa's Talking so
app/tasks/alert_tasks.py never touches the raw SDK/HTTP directly.
"""
import requests
from flask import current_app


AT_SMS_URL = "https://api.africastalking.com/version1/messaging"


def send_sms(to, message):
    username = current_app.config.get("AT_USERNAME", "sandbox")
    api_key =  current_app.config.get("AT_API_KEY")

    resp = requests.post(
        AT_SMS_URL,
        data={
            "username": username,
            "to": to,
            "message": message
        },
        headers={
            "api_key": api_key,
            "Accept": "application/json"
        },
        timeout=15
    )
    resp.raise_for_status()
    return resp.json()



# TODO(Phase 6): send_whatsapp() once WhatsApp Business API credentials are provisioned
