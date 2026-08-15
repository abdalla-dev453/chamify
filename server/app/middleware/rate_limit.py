"""
Thin wrapper around Flask-Limiter so sensitive endpoints (login, OTP
request, M-Pesa webhook) can declare tighter limits inline without every
blueprint importing the raw limiter instance directly.
"""
from app.extensions import limiter

auth_rate_limit = "10 per minute"
otp_rate_limit = "5 per minute"
webhook_rate_limit = "60 per minute"

__all__ = ["limiter", "auth_rate_limit", "otp_rate_limit", "webhook_rate_limit"]