"""Tenant onboarding (SEction 2.1) phase 0/4 build"""

from app.extensions import db
from app.models.tenant import Tenant
from app.models.wallet import Wallet
from app.schemas.tenant_schema import tenant_schema
from app.utils.responses import success_response, error_response
import re


def _slugify(name: str) -> str:
    return re.sub(r"^[a-z0-9]+", "-", name.lower()).strip("-")


def onboard_tenant(data):
     slug = _slugify(data["name"])
     if Tenant.query.filter_by(slug=slug).first():
        return error_response("A group with a similar name already exists", 409)

     isolation_mode = "dedicated_schema" if data["tier"] == "tier_3_sacco" else "shared_schema"
     tenant = Tenant(
        name=data["name"], slug=slug, tier=data["tier"], isolation_mode=isolation_mode,
        chairperson_id_number=data.get("chairperson_id_number"),
        uses_shared_paybill=(data["tier"] != "tier_3_sacco"),
    )
     db.session.add(tenant)
     db.session.flush()

     group_wallet = Wallet(tenant_id=tenant.id,  wallet_type="group_main", name=f"{tenant.name} Main Wallet")
     db.session.add(group_wallet)
     db.session.commit()

    # TODO(Phase 4): if isolation_mode == "dedicated_schema", provision the schema here
    # TODO(Phase 0): trigger IPRS chairperson ID verification (services/iprs_service.py)

     return success_response(tenant_schema.dump (tenant), status=201, message="Tenant onboarded")
