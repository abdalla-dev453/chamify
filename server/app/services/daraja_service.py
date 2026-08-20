"""
Thin client around Safaricom's Daraja API (Section 4.2). Keeping this as
the ONLY file that talks HTTP to Daraja means swapping sandbox->production,
or adding retry/backoff, happens in one place.
"""

import base64
from datetime import datetime
import requests
from flask import current_app


BASE_URLS = {
    "sandbox": "https://sandbox.safaricom.co.ke",
    "production": "https://api.safaricom.co.ke",
}


class DarajaService:
    """
    Tenant-aware wrapper client interfacing directly with Safaricom Daraja.
    Encapsulates token management, payload formatting, and HTTP processing states.
    """

    def __init__(self, tenant_id=None):
        """
        Initializes the service. Captures tenant context explicitly to handle
        future multi-tenant configuration lookups from databases or storage bags.
        """
        self.tenant_id = tenant_id

    def _base_url(self):
        # FIX: Changed dangerous tuple lookup syntax to standard dict .get() method
        env = current_app.config.get("DARAJA_ENV", "sandbox")
        return BASE_URLS.get(env, BASE_URLS["sandbox"])

    def get_access_token(self):
        key = current_app.config["DARAJA_CONSUMER_KEY"]
        secret = current_app.config["DARAJA_CONSUMER_SECRET"]

        resp = requests.get(
            f"{self._base_url()}/oauth/v1/generate?grant_type=client_credentials",
            auth=(key, secret),
            timeout=15
        )
        resp.raise_for_status()
        return resp.json()["access_token"]

    def _password_and_timestamp(self):
        shortcode = current_app.config["DARAJA_SHORTCODE"]
        passkey = current_app.config["DARAJA_PASSKEY"]
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        raw = f"{shortcode}{passkey}{timestamp}"
        password = base64.b64encode(raw.encode()).decode()
        return password, timestamp

    def trigger_stk_push(self, phone_number, amount, account_reference, description="Chamify contribution"):
        """
        Dispatches an express checkout validation prompt screen immediately
        to an end-user mobile interface device.
        """
        try:
            token = self.get_access_token()
            password, timestamp = self._password_and_timestamp()
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
                "CallBackURL": f"{callback_base}/api/v1/mpesa/callback/{self.tenant_id}",
                "AccountReference": account_reference,
                "TransactionDesc": description,
            }
            
            resp = requests.post(
                f"{self._base_url()}/mpesa/stkpush/v1/processrequest",
                json=payload, 
                headers={"Authorization": f"Bearer {token}"},
                timeout=15
            )
            return resp.json(), resp.status_code
        except requests.exceptions.RequestException as e:
            # Prevent thread lock crashes by catching connection exceptions gracefully
            error_data = {"error": "Handshake exception with gateway broker", "details": str(e)}
            status_code = e.response.status_code if e.response else 502
            return error_data, status_code

    def send_b2c_payout(self, phone_number, amount, remarks="Loan disbursement"):
        """
        Powers instant business loan disbursement pipelines (Section 4.2)
        by transferring funds out of your B2C shortcode block to a member.
        """
        try:
            token = self.get_access_token()
            shortcode = current_app.config["DARAJA_SHORTCODE"]
            callback_base = current_app.config["DARAJA_CALLBACK_BASE"]
            security_credential = current_app.config.get("DARAJA_SECURITY_CREDENTIAL", "SET_ME")

            payload = {
                "InitiatorName": current_app.config.get("DARAJA_INITIATOR_NAME", "chamaledger_api"),
                "SecurityCredential": security_credential,
                "CommandID": "BusinessPayment",
                "Amount": int(amount),
                "PartyA": shortcode,
                "PartyB": phone_number,
                "Remarks": remarks,
                "QueueTimeOutURL": f"{callback_base}/api/v1/mpesa/callback/b2c/{self.tenant_id}",
                "ResultURL": f"{callback_base}/api/v1/mpesa/callback/b2c/{self.tenant_id}",
                "Occasion": "LoanDisbursement",
            }
            
            resp = requests.post(
                f"{self._base_url()}/mpesa/b2c/v1/paymentrequest",
                json=payload, 
                headers={"Authorization": f"Bearer {token}"},
                timeout=15
            )
            return resp.json(), resp.status_code
        except requests.exceptions.RequestException as e:
            error_data = {"error": "Handshake exception with B2C gateway broker", "details": str(e)}
            status_code = e.response.status_code if e.response else 502
            return error_data, status_code
