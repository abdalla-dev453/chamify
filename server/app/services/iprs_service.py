"""
IPRS national ID cross-check (Section 4.2), required for Tier 3 onboarding.
Kenya's IPRS does not expose a public API — in production this typically
goes through a licensed aggregator. Kept as a swappable interface.
"""
import requests
from flask import current_app


def verify_national_id(id_number, full_name):
    url = current_app.config.get("IPRS_API_URL")
    key = current_app.config.get("IPRS_API_KEY")
    if not url:
        # No aggregator configured yet — fail safe to "unverified", never silently "true"
        return {"verified": False, "reason": "IPRS integration not configured"}

    resp = requests.post(
        url, json={"id_number": id_number, "full_name": full_name},
        headers={"Authorization": f"Bearer {key}"}, timeout=15,
    )
    resp.raise_for_status()
    return resp.json()