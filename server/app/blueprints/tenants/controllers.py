"""Tenant onboarding (SEction 2.1) phase 0/4 build"""
import re
from app.extensions import db
from app.models.tenant import Tenant
from app.models.wallet import Wallet
from app.schemas.tenant_schema import tenant_schema
from app.utils.responses import success_response, error_response


def _slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def onboard_tenant(data):
    """
    Onboards a new group/chama workspace.
    Determines architecture separation rules and runs third-party regulatory KYC lookups.
    """
    slug = _slugify(data["name"])
    if Tenant.query.filter_by(slug=slug).first():
        return error_response("A group with a similar name already exists", 409)

    isolation_mode = "dedicated_schema" if data["tier"] == "tier_3_sacco" else "shared_schema"
    
    tenant = Tenant(
        name=data["name"], 
        slug=slug, 
        tier=data["tier"], 
        isolation_mode=isolation_mode,
        chairperson_id_number=data.get("chairperson_id_number"),
        uses_shared_paybill=(data["tier"] != "tier_3_sacco"),
        iprs_verified=False  # Initialize verification state as unconfirmed
    )
    
    db.session.add(tenant)
    db.session.flush()

    # Provision standard primary cash holding tracking containers
    group_wallet = Wallet(
        tenant_id=tenant.id,  
        wallet_type="group_main", 
        name=f"{tenant.name} Main Wallet"
    )
    db.session.add(group_wallet)
    db.session.commit()

    # 1. Complete Phase 4 TODO: Dynamic PostgreSQL/MySQL Dedicated Schema Provisioning
    if isolation_mode == "dedicated_schema":
        try:
            # Prevent SQL Injection by stripping raw strings to clean alphanumeric tokens
            safe_schema_name = f"tenant_{re.sub(r'[^a-zA-Z0-9_]', '', tenant.id)}"
            
            # Execute raw schema generation against your backing database server engine
            db.session.execute(db.text(f"CREATE SCHEMA {safe_schema_name};"))
            db.session.commit()
            
            # TODO: If utilizing an automated migration runner like Alembic, 
            # dispatch or invoke structural table copying strategies inside the new schema here.
        except Exception as schema_err:
            db.session.rollback()
            return error_response(f"Database schema provisioning isolation layer failed: {str(schema_err)}", 500)

    # 2. Complete Phase 0 TODO: Trigger Kenyan National IPRS Chairperson Identity Validation
    chairperson_id = data.get("chairperson_id_number")
    if chairperson_id:
        from app.services.iprs_service import IprsService # Localized import to protect system execution trees
        
        iprs = IprsService()
        iprs_response, iprs_status = iprs.verify_national_id(chairperson_id)
        
        if iprs_status == 200 and iprs_response.get("isValid") is True:
            tenant.iprs_verified = True
            # Dynamically attach names verified on government citizen registration registries if fields exist
            if hasattr(tenant, "chairperson_official_name"):
                tenant.chairperson_official_name = iprs_response.get("citizenName")
            db.session.commit()
        else:
            # Fail gracefully by logging the failure on the record rather than rolling back the entire onboarding process.
            # This allows system admins to review pending entries via the /kyc-queue dashboard endpoint we built.
            tenant.iprs_verified = False
            db.session.commit()

    return success_response(tenant_schema.dump(tenant), status=201, message="Tenant onboarded successfully")
