"""
Kenya-specific input validation helpers — phone numbers, national IDs —
shared by schemas, blueprints, and Celery tasks alike.
"""

import re


KENYAN_PHONE_RE = re.compile(r"^(?:\+?254|0)(7|1)\d{8}$")

def normalize_kenyan_phone(raw: str) -> str:
    """
    Accepts 07xxxxxxxx, +254xxxxxxxx, 25471xxxxxxxx, 71xxxxxxxx, and returns the cannonical
    phone number 25471xxxxxxxx / 2541xxxxxxxx form used everywhere in the DB
    """
    digits = re.sub(r"\D", "", raw or "")
    if digits.startswith("0"):
        digits = "254" + digits[1:]
    elif digits.startswith("254"):
        pass
    elif len(digits) == 9:
        digits = "254" + digits
    return digits


def is_valid_kenyan_phone(raw: str) -> bool:
    return bool(KENYAN_PHONE_RE.match(normalize_kenyan_phone(raw)))


def is_valid_national_id(raw: str) -> bool:
    return bool(raw) and raw.isdigit() and 6 <= len(raw) <= 10