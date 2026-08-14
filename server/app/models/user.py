"""
Platform users. RBAC hierarchy from Section 4.3:
System Admin -> Group Admin/Pastor -> Branch/Jumuiya Leader -> Treasurer -> Member
"""
from app.extensions import db
from app.models.base import TenantScopedModel
from app.utils.security import hash_password, verify_password

ROLES = (
    "system_admin",       # Global Admin Super-Dashboard, Section 5 — not tenant-bound
    "group_admin",        # chairperson / pastor
    "branch_leader",      # branch / jumuiya leader
    "treasurer",
    "member",
)


class User(TenantScopedModel):
    __tablename__ = "users"

    tenant_id = db.Column(db.String(36), db.ForeignKey("tenants.id"), nullable=True, index=True)
    # nullable because system_admin users are platform-level, not tenant-bound

    full_name = db.Column(db.String(150), nullable=False)
    phone_number = db.Column(db.String(20), nullable=False, index=True)  # 2547XXXXXXXX
    email = db.Column(db.String(150), nullable=True, unique=True)
    national_id = db.Column(db.String(20), nullable=True)  # for IPRS cross-check

    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum(*ROLES, name="user_role"), nullable=False, default="member")

    is_active = db.Column(db.Boolean, default=True)
    is_phone_verified = db.Column(db.Boolean, default=False)
    is_iprs_verified = db.Column(db.Boolean, default=False)

    # 2FA — Section 4.6 "2FA everywhere money moves"
    two_factor_enabled = db.Column(db.Boolean, default=True)
    preferred_locale = db.Column(db.String(5), default="en")

    __table_args__ = (
        db.UniqueConstraint("tenant_id", "phone_number", name="uq_user_tenant_phone"),
    )

    def set_password(self, raw_password: str):
        self.password_hash = hash_password(raw_password)

    def check_password(self, raw_password: str) -> bool:
        return verify_password(raw_password, self.password_hash)

    def __repr__(self):
        return f"<User {self.phone_number} role={self.role}>"