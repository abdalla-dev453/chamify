"""
Thin client around Safaricom's Daraja API (Section 4.2). Keeping this as
the ONLY file that talks HTTP to Daraja means swapping sandbox->production,
or adding retry/backoff, happens in one place.
"""

import base64
import requests
from datetime import datetime
from flask import current_app


BASE_URLS = {
    "sandbox": "https://sandbox.safaricom.co.ke",
    "production": "https://api.safaricom.co.ke",
}


def _base_url():
    return BASE_URLS[current_app.config["DARAJA_ENV", "sandbox"]]

def get_access_token():
    key = current_app.config["DARAJA_CONSUMER_KEY"]
    secret = current_app.config["DARAJA_CONSUMER_SECRET"]

    resp = requests.get(
        f"{_base_url()}/oauth/v1/generate?grant_type=client_credentials",
        auth=(key, secret),
        timeout=15
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


def _password_and_timestamp():
    shortcode = current_app.config["DARAJA_SHORTCODE"]
    passkey = current_app.config["DARAJA_PASSKEY"]
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    raw = f"{shortcode}{passkey}{timestamp}"
    password = base64.b64encode(raw.encode()).decode()
    return password, timestamp


def initiate_stk_push(
        phone_number,
        amount,
        account_reference,
        description="Chamify contribution",
):
    token = get_access_token()
    password, timestamp = _password_and_timestamp()
    shortcode = current_app.config["DARAJA_SHORTCODE"]
    callback_base = current_app.config["DARAJA_CALLBACK_BASE"]

    payload = {
        "BusinessShortCode": shortcode,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": int(amount),
        "PartyA": phone_number,
        "PartyB": shortcode,
        "PhoneNumber": phone_number,
        "CallBackURL": f"{callback_base}/api/v1/mpesa/callback",
        "AccountReference": account_reference,
        "TransactionDesc": description,
    }
    resp = requests.post(
        f"{_base_url()}/mpesa/stkpush/v1/processrequest",
        json=payload, headers={
            "Authorization": f"Bearer {token}"
        },
        timeout=15
    )
    resp.raise_for_status()
    return resp.json()



def initiate_b2c_payment(
        phone_number,
        amount,
        remarks="Loan disbursement"
):
    """Powers instant loan disbursement (Section 4.2)"""
    token = get_access_token()
    shortcode = current_app.config["DARAJA_SHORTCODE"]
    callback_base = current_app.config["DARAJA_CALLBACK_BASE"]

    payload = {
        "InitiatorName": "chamaledger_api",
        "SecurityCredential": "SET_ME",  # encrypted initiator password, from Daraja portal
        "CommandID": "BusinessPayment",
        "Amount": int(amount),
        "PartyA": shortcode,
        "PartyB": phone_number,
        "Remarks": remarks,
        "QueueTimeOutURL": f"{callback_base}/api/v1/mpesa/b2c/timeout",
        "ResultURL": f"{callback_base}/api/v1/mpesa/b2c/result",
        "Occasion": "LoanDisbursement",
    }
    resp = requests.post(
        f"{_base_url()}/mpesa/b2c/v1/paymentrequest",
        json=payload, headers={
            "Authorization": f"Bearer {token}"
        },
        timeout=15
    )
    resp.raise_for_status()
    return resp.json()