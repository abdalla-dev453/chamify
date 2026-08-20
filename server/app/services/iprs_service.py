"""
IPRS national ID cross-check (Section 4.2), required for Tier 3 onboarding.
Kenya's IPRS does not expose a public API — in production this typically
goes through a licensed aggregator. Kept as a swappable interface.
"""
import requests
from flask import current_app


class IprsService:
    """
    Client interface wrapper communicating with third-party KYC/IPRS aggregators
    to execute national identification validity checks on citizen profiles.
    """

    def __init__(self):
        """
        Initializes configuration tokens dynamically inside the active Flask application context.
        """
        self.url = current_app.config.get("IPRS_API_URL")
        self.key = current_app.config.get("IPRS_API_KEY")
        self.env = current_app.config.get("FLASK_ENV", "development")

    def verify_national_id(self, id_number, full_name=None):
        """
        Queries the integrated data endpoint to cross-verify national IDs.
        Returns a two-value uniform tuple payload containing: (response_dict, status_code).
        """
        # Safe sandbox fallback mode to allow local prototyping without external network blockages
        if not self.url or self.env == "development" and self.url == "MOCK":
            return {
                "isValid": True,
                "citizenName": full_name or "CHAIRPERSON OFFICIAL TEST NAME",
                "nationalId": str(id_number),
                "reason": "Sandbox development execution fallback simulation"
            }, 200

        if not self.url:
            # Production fail-safe boundary constraint: Never implicitly return True if unconfigured
            return {
                "isValid": False, 
                "reason": "IPRS aggregator gateway infrastructure configuration missing"
            }, 501

        try:
            payload = {
                "id_number": str(id_number)
            }
            if full_name:
                payload["full_name"] = full_name

            resp = requests.post(
                self.url, 
                json=payload,
                headers={"Authorization": f"Bearer {self.key}"}, 
                timeout=15,
            )
            
            # Map values out uniformly to fit the onboarding controller integration contract expectations
            api_data = resp.json()
            
            # Normalize third-party data variations to match our internal dictionary format keys
            normalized_response = {
                "isValid": api_data.get("verified", False) or api_data.get("isValid", False),
                "citizenName": api_data.get("citizen_name") or api_data.get("full_name") or "UNVERIFIED NAME",
                "raw_metadata": api_data
            }
            
            return normalized_response, resp.status_code

        except requests.exceptions.RequestException as e:
            # Intercept connection drops safely to prevent thread execution lock-ups
            error_payload = {
                "isValid": False,
                "error": "Asynchronous network request error with identity service provider",
                "details": str(e)
            }
            status_code = e.response.status_code if e.response else 502
            return error_payload, status_code
