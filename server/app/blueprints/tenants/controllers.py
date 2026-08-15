"""Tenant onboarding (SEction 2.1) phase 0/4 build"""

from app.extensions import db
from app.models.tenant import Tenant
from app.models.wallet import Wallet
from app.schemas.tenant_schema import tenant_schema
from app.utils.responses import success_response, error_response
import re


def _slugify(name: str) -> str:
    return re.sub(r"^[a-z0-9]+", "-", name.lower()).strip("-")


def onboard_tenant(data)