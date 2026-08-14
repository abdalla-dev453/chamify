"""
Tenant = one chama, church group, or SACCO on the platform (Section 2.1).
Global table — NOT tenant-scoped, since it IS the tenant boundary.
"""
from app.extensions import db
from app.models.base import BaseModel

TENANT_TIERS = ("tier_1_informal", "tier_2_registered", "tier_3_sacco")
ISOLATION_MODES = ("shared_schema", "dedicated_schema")


class Tenant(BaseModel):
    __tablename__ = "tenants"

    name = db.Column(db.String(150), nullable=False)
    slug = db.Column(db.String(150), unique=True, nullable=False, index=True)
    tier = db.Column(db.Enum(*TENANT_TIERS, name="tenant_tier"), nullable=False, default="tier_1_informal")
    isolation_mode = db.Column(
        db.Enum(*ISOLATION_MODES, name="isolation_mode"), nullable=False, default="shared_schema"
    )
    # Tier 3 SACCOs get a dedicated schema/db provisioned at signup (Section 2.2)
    dedicated_schema_name = db.Column(db.String(63), nullable=True)

    # Kenya-first onboarding artifacts (Section 2.1 table)
    chairperson_id_number = db.Column(db.String(20), nullable=True)
    registration_certificate_url = db.Column(db.String(500), nullable=True)
    cr12_document_url = db.Column(db.String(500), nullable=True)
    iprs_verified = db.Column(db.Boolean, default=False)

    # Paybill model (Section 2.1)
    uses_shared_paybill = db.Column(db.Boolean, default=True)
    dedicated_shortcode = db.Column(db.String(20), nullable=True)  # own Daraja shortcode, Tier 3

    # Whitelabel / branding
    custom_domain = db.Column(db.String(255), nullable=True, unique=True)
    logo_url = db.Column(db.String(500), nullable=True)
    primary_color = db.Column(db.String(7), default="#059669")   # emerald
    secondary_color = db.Column(db.String(7), default="#1e293b")  # slate
    accent_color = db.Column(db.String(7), default="#ea580c")     # orange

    is_active = db.Column(db.Boolean, default=True)
    is_suspended = db.Column(db.Boolean, default=False)
    locale = db.Column(db.String(5), default="en")  # "en" or "sw" — Section 4.5

    users = db.relationship("User", backref="tenant", lazy="dynamic", cascade="all, delete-orphan")
    wallets = db.relationship("Wallet", backref="tenant", lazy="dynamic", cascade="all, delete-orphan")
    subscription = db.relationship("Subscription", backref="tenant", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Tenant {self.slug} ({self.tier})>"